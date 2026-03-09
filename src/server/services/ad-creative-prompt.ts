export type AdCreativePromptJson = {
  prompt: string;
  negative_prompt: string;
  settings: {
    aspect_ratio: string;
    style: string;
    lighting: string;
    camera: {
      lens: string;
      angle: string;
      framing: string;
      depth_of_field: string;
    };
    color_grading: string;
  };
  has_reference_image?: boolean;
};

export type ClientDefaults = {
  name: string;
  industry: string;
  defaultStyle: string;
  defaultLighting: string;
  defaultColorGrading: string;
  defaultAspectRatio: string;
  brandNotes: string | null;
};

export const AD_CREATIVE_SYSTEM_PROMPT = `You are an expert ad creative director specializing in Facebook and Instagram advertising.
Your job is to convert plain-text creative briefs into structured JSON prompts optimized for the Gemini image generation API.

Always respond with ONLY valid JSON, no other text, no markdown backticks.

JSON schema:
{
  "prompt": "Detailed visual description optimized for photorealistic ad creative",
  "negative_prompt": "Elements to exclude from the image",
  "settings": {
    "aspect_ratio": "1:1 | 4:5 | 9:16 | 16:9",
    "style": "ugc-selfie | studio-product-hero | lifestyle-in-context | flat-lay | before-after | editorial-beauty | unboxing-moment",
    "lighting": "ring-light | natural-window | golden-hour | studio-softbox | bathroom-vanity | overhead-natural",
    "camera": {
      "lens": "24mm | 35mm | 50mm | 85mm | 105mm | 200mm",
      "angle": "eye-level | low-angle | high-angle | overhead",
      "framing": "extreme-close-up | close-up | medium | full-body | wide",
      "depth_of_field": "shallow | moderate | deep"
    },
    "color_grading": "warm | cool | neutral | muted | vibrant | cinematic"
  }
}

Rules for the prompt field:
- For UGC style: always add "shot on iPhone, slight motion blur, casual composition, imperfect framing"
- For people: always add "visible pores, natural skin texture, subtle blemishes" — never airbrushed skin
- For products: specify exact material properties (matte packaging, glossy label, etc.)
- For children: always include clear commercial context (e.g. "child in a toy store advertisement")
- Always write the prompt in English regardless of input language

Default negative_prompt: "blurry, low quality, distorted, extra fingers, extra limbs, watermark, cartoon, illustration, anime, 3d render, oversaturated, plastic skin, airbrushed, stock photo feel, text overlay, logo"`;

export function buildAdCreativeUserMessage(
  brief: string,
  client: ClientDefaults,
  platform: string,
  hasReferenceImage: boolean
): string {
  const platformAspectMap: Record<string, string> = {
    facebook: "4:5",
    instagram: "1:1",
    stories: "9:16",
    carousel: "1:1"
  };

  const aspectRatio = platformAspectMap[platform] ?? client.defaultAspectRatio;

  return `Creative brief: ${brief}

Client context:
- Client name: ${client.name}
- Industry: ${client.industry}
- Preferred style: ${client.defaultStyle}
- Preferred lighting: ${client.defaultLighting}
- Preferred color grading: ${client.defaultColorGrading}
- Aspect ratio (based on platform "${platform}"): ${aspectRatio}
${client.brandNotes ? `- Brand notes: ${client.brandNotes}` : ""}
${hasReferenceImage ? "- Reference product image provided: true" : ""}

Use the client's preferred defaults unless the brief explicitly overrides them.
${hasReferenceImage ? 'Include "has_reference_image": true in the JSON output.' : ""}`;
}
