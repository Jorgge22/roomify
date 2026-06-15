import {ROOMIFY_RENDER_PROMPT} from "./constants";
import puter from "@heyputer/puter.js";

const USE_MOCK_AI_RENDER = import.meta.env.DEV || import.meta.env.VITE_MOCK_AI_RENDER === "true";
const MOCK_RENDER_DELAY_MS = 3500;

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

export const fetchAsDataUrl = async (url: string): Promise<string> => {
    const response = await fetch(url);

    if(!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const blob = await response.blob();

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    })
};

export const generate3DView = async ({ sourceImage }: Generate3DViewParams) => {
    const dataUrl = sourceImage.startsWith('data:')
        ? sourceImage
        : await fetchAsDataUrl(sourceImage);

    if (USE_MOCK_AI_RENDER) {
        await wait(MOCK_RENDER_DELAY_MS);
        return {renderedImage: dataUrl, renderedPath: undefined};
    }

    const base64Data = dataUrl.split(',')[1];
    const mimeType = dataUrl.split(';')[0].split(':')[1];

    if(!mimeType || !base64Data) throw new Error(`Invalid source image payload`);

    let response: unknown;

    try {
        response = await puter.ai.txt2img(ROOMIFY_RENDER_PROMPT, {
            provider: 'gemini',
            model: 'gemini-2.5-flash-image-preview',
            input_image: base64Data,
            input_image_mime_type: mimeType,
            ratio: { w: 1024, h: 1024 }
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`AI render failed. Check your Puter/Gemini balance or enable VITE_MOCK_AI_RENDER=true for local development. ${message}`);
    }

    const rawImageUrl = (response as HTMLImageElement).src ?? null;

    if(!rawImageUrl) return { renderedImage: null, renderedPath: undefined };

    const renderedImage = rawImageUrl.startsWith('data:')
        ? rawImageUrl: await fetchAsDataUrl(rawImageUrl);

    return { renderedImage, renderedPath: undefined };
}
