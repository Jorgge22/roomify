import puter from "@heyputer/puter.js";
import {getOrCreateHostingConfig, uploadImageToHosting} from "./puter.hosting";
import {isHostedUrl} from "./utils";
import {PUTER_WORKER_URL} from "./constants";

const USE_LOCAL_PROJECTS = import.meta.env.DEV || import.meta.env.VITE_LOCAL_PROJECTS === "true";
const LOCAL_PROJECTS_KEY = "roomify:projects";

const getLocalProjects = (): DesignItem[] => {
    if (typeof window === "undefined") return [];

    try {
        const raw = window.localStorage.getItem(LOCAL_PROJECTS_KEY);
        const projects = raw ? JSON.parse(raw) : [];

        return Array.isArray(projects) ? projects : [];
    } catch {
        return [];
    }
}

const setLocalProjects = (projects: DesignItem[]) => {
    if (typeof window === "undefined") return;

    window.localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(projects));
}

export const signIn = async () => await puter.auth.signIn();

export const signOut = () => puter.auth.signOut();

export const getCurrentUser = async () => {
    try {
        return await puter.auth.getUser();
    } catch {
        return null;
    }
}

export const createProject = async ({ item, visibility = "private" }: CreateProjectParams): Promise<DesignItem | null | undefined> => {
    if (USE_LOCAL_PROJECTS) {
        const payload = {
            ...item,
            isPublic: visibility === "public",
            timestamp: item.timestamp ?? Date.now(),
        };
        const projects = getLocalProjects();
        const nextProjects = [payload, ...projects.filter((project) => project.id !== payload.id)];

        setLocalProjects(nextProjects);

        return payload;
    }

    if (!PUTER_WORKER_URL) {
        console.warn('Missing VITE_PUTER_WORKER_URL; skip history fetch');
        return null;
    }

    const projectId = item.id;

    const hosting = await getOrCreateHostingConfig();

    const hostedSource = projectId ?
        await uploadImageToHosting({
            hosting, url: item.sourceImage, projectId, label: "source",
        }) : null;

    const hostedRender = projectId && item.renderedImage ?
        await uploadImageToHosting({
            hosting, url: item.renderedImage, projectId, label: "rendered",
        }) : null;

    const resolvedSource = hostedSource?.url || (isHostedUrl(item.sourceImage)
            ? item.sourceImage
            : ''
    );

    if (!resolvedSource) {
        console.warn("Failed to host source image, skipping save.");
        return null;
    }

    const resolvedRender = hostedRender?.url
        ? hostedRender?.url
        : item.renderedImage && isHostedUrl(item.renderedImage)
            ? item.renderedImage
            : undefined;

    const {
        sourcePath: _sourcePath,
        renderedPath: _renderedPath,
        publicPath: _publicPath,
        ...rest
    } = item;

    const payload = {
        ...rest,
        sourceImage: resolvedSource,
        renderedImage: resolvedRender,
    }

    try {
        const response = await puter.workers.exec(`${PUTER_WORKER_URL}/api/projects/save`, {
            method: 'POST',
            body: JSON.stringify({
                project: payload,
                visibility
            })
        });

        if(!response.ok) {
            console.error("Failed to save the project", await response.text());
            return null;
        }

        const data = (await response.json()) as { project?: DesignItem | null };

        return data?.project ?? null;
    } catch (e) {
        console.log("Failed to save project", e);
        return null;
    }
}

export const getProjects = async () => {
    if (USE_LOCAL_PROJECTS) {
        return getLocalProjects();
    }

    if (!PUTER_WORKER_URL) {
        console.warn('Missing VITE_PUTER_WORKER_URL; skip history fetch');
        return [];
    }

    try {
        const response = await puter.workers.exec(`${PUTER_WORKER_URL}/api/projects/list`, {
            method: 'GET',
        });

        if (!response.ok) {
            console.error("Failed to fetch history", await response.text());
            return [];
        }

        const data = (await response.json()) as { projects?: DesignItem[] | null };

        return Array.isArray(data?.projects) ? data?.projects : [];
    } catch (e) {
        console.error('Failed to get projects', e);
        return [];
    }
}

export const getProjectById = async ({ id }: { id: string }) => {
    if (USE_LOCAL_PROJECTS) {
        return getLocalProjects().find((project) => project.id === id) ?? null;
    }

    if (!PUTER_WORKER_URL) {
        console.warn("Missing VITE_PUTER_WORKER_URL; skipping project fetch.");
        return null;
    }

    console.log("Fetching project with ID:", id);

    try {
        const response = await puter.workers.exec(`${PUTER_WORKER_URL}/api/projects/get?id=${encodeURIComponent(id)}`,
            { method: "GET" },
        );

        console.log("Fetch project response:", response);

        if (!response.ok) {
            console.error("Failed to fetch project:", await response.text());
            return null;
        }

        const text = await response.text();
        if (!text.trim()) {
            console.error("Empty response from server");
            return null;
        }

        const data = JSON.parse(text) as {
            project?: DesignItem | null;
        };

        console.log("Fetched project data:", data);

        return data?.project ?? null;
    } catch (error) {
        console.error("Failed to fetch project:", error);
        return null;
    }
};
