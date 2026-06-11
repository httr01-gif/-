// api/generate.js  —  면접 프로필 보정 (OpenAI gpt-image-1 edits)
// 환경변수 OPENAI_API_KEY 필요. 키는 절대 프런트로 노출되지 않습니다(서버에서만 사용).

export const config = { maxDuration: 60 }; // 이미지 편집은 수십 초 걸릴 수 있음

// ---- 화이트리스트 옵션 → 프롬프트 조각 (서버에서 고정 제어) ----
const BG = {
  white: "a clean, evenly lit pure white studio backdrop",
  gray:  "a smooth neutral light-gray studio backdrop",
  blue:  "a soft professional blue-gray studio backdrop",
};
const SIZE = { portrait: "1024x1536", square: "1024x1024" };

function buildPrompt({ bg, attire }) {
  const backdrop = BG[bg] || BG.white;
  const attireLine = attire
    ? "Dress the person in neat, simple business attire (a dark blazer over a light collared shirt) suitable for a job interview, while keeping the face, hairstyle and skin tone unchanged. "
    : "Keep the person's existing clothing. ";

  // 정체성 보존을 최우선으로 고정
  return (
    "Retouch this photo into a clean, professional job-interview profile portrait. " +
    "CRITICAL: keep the person's exact face, identity, bone structure, facial features, " +
    "proportions, skin texture, eyes, hair and natural expression. " +
    "Do NOT beautify, slim, smooth, age, or reshape the face. This must still clearly be the same person. " +
    "Gently correct close-up / wide-angle selfie perspective distortion so the facial proportions look natural, " +
    "as if photographed with an 85mm portrait lens from about 2 meters. " +
    "Apply even, soft, neutral studio lighting and remove harsh shadows or color casts. " +
    "Replace the background with " + backdrop + ". " +
    attireLine +
    "Head-and-shoulders framing, subject centered, facing forward, calm professional expression. " +
    "Photorealistic, high resolution, natural skin. Output a real photograph, not an illustration or painting."
  );
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST 요청만 지원합니다." });
  }
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "서버에 OPENAI_API_KEY가 설정되지 않았습니다." });
  }

  try {
    const { image, bg = "white", attire = false, ratio = "portrait" } = req.body || {};
    if (!image || typeof image !== "string") {
      return res.status(400).json({ error: "이미지가 전달되지 않았습니다." });
    }

    // data URL → 바이너리
    const b64 = image.replace(/^data:image\/\w+;base64,/, "");
    const buf = Buffer.from(b64, "base64");
    if (buf.length > 4 * 1024 * 1024) {
      return res.status(413).json({ error: "이미지가 너무 큽니다. 더 작은 사진을 사용하세요." });
    }
    const blob = new Blob([buf], { type: "image/png" });

    const form = new FormData();
    form.append("model", "gpt-image-1.5");          // 더 선명하고 빠른 최신 모델 (gpt-image-1 로 되돌릴 수 있음)
    form.append("image", blob, "input.png");
    form.append("prompt", buildPrompt({ bg, attire }));
    form.append("size", SIZE[ratio] || SIZE.portrait);
    form.append("input_fidelity", "high");          // 얼굴 보존 핵심
    form.append("quality", "high");                 // 선명도 우선. 시간 초과(504)가 나면 "medium"으로 낮추세요
    form.append("n", "1");

    const r = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });

    const data = await r.json();
    if (!r.ok) {
      return res.status(r.status).json({
        error: data?.error?.message || "OpenAI 요청이 실패했습니다.",
      });
    }
    const out = data?.data?.[0]?.b64_json;
    if (!out) return res.status(502).json({ error: "결과 이미지를 받지 못했습니다." });

    return res.status(200).json({ image: `data:image/png;base64,${out}` });
  } catch (e) {
    return res.status(500).json({ error: e.message || "알 수 없는 오류" });
  }
}
