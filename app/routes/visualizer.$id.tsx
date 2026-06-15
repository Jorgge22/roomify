import {useLocation, useNavigate, useOutletContext, useParams} from "react-router";
import {useEffect, useRef, useState} from "react";
import {generate3DView} from "../../lib/ai.action";
import {Box, Download, RefreshCcw, Share2, X} from "lucide-react";
import Button from "../../components/ui/Button";
import {createProject, getProjectById} from "../../lib/puter.action.tsx";

const VisualizerId = () => {
    const {id} = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const {userId} = useOutletContext<AuthContext>();
    const locationState = location.state as VisualizerLocationState | null;

    const hasInitialGenerated = useRef(false);

    const [project, setProject] = useState<DesignItem | null>(null);
    const [isProjectLoading, setIsProjectLoading] = useState(true);

    const [isProcessing, setIsProcessing] = useState(false);
    const [currentImage, setCurrentImage] = useState<string | null>(null);
    const [renderError, setRenderError] = useState<string | null>(null);

    const handleBack = () => navigate('/');

<<<<<<< HEAD
    const runGeneration = async (item: DesignItem) => {
        if (!id || !item.sourceImage) return;
=======
    const runGeneration = async (item: DesignItem) => {
        if (!id || !item.sourceImage) return;
>>>>>>> 4d585d1 (fix errors)

        try {
            setIsProcessing(true);
            setRenderError(null);
            const result = await generate3DView({sourceImage: item.sourceImage});

            if (result.renderedImage) {
                setCurrentImage(result.renderedImage);

                const updatedItem = {
                    ...item,
                    renderedImage: result.renderedImage,
                    renderedPath: result.renderedPath,
                    timestamp: Date.now(),
                    ownerId: item.ownerId ?? userId ?? null,
                    isPublic: item.isPublic ?? false,
                }

                const saved = await createProject({item: updatedItem, visibility: "private"});

                if (saved) {
                    setProject(saved);
                    setCurrentImage(saved.renderedImage || result.renderedImage);
                }
            }
        } catch (error) {
            console.error('Generation failed: ', error);
            setRenderError(error instanceof Error ? error.message : 'AI render failed.');
        } finally {
            setIsProcessing(false);
        }
    }

    useEffect(() => {
        let isMounted = true;

        const loadProject = async () => {
            if (!id) {
                setIsProjectLoading(false);
                return;
            }

            setIsProjectLoading(true);

            const fallbackProject = locationState?.initialImage
                ? {
                    id,
                    name: locationState.name ?? `Residence ${id}`,
                    sourceImage: locationState.initialImage,
                    renderedImage: locationState.initialRender ?? null,
                    timestamp: Date.now(),
                    ownerId: locationState.ownerId ?? userId ?? null,
                    isPublic: false,
                    sharedBy: locationState.sharedBy ?? null,
                }
                : null;

            const fetchedProject = await getProjectById({id});

            if (!isMounted) return;

            const resolvedProject = fetchedProject ?? fallbackProject;

            setProject(resolvedProject);
            setCurrentImage(resolvedProject?.renderedImage || null);
            setIsProjectLoading(false);
            hasInitialGenerated.current = false;
        };

        loadProject();

        return () => {
            isMounted = false;
        };
    }, [id, locationState, userId]);

    useEffect(() => {
        if (
            isProjectLoading ||
            hasInitialGenerated.current ||
            !project?.sourceImage
        )
            return;

        if (project.renderedImage) {
            setCurrentImage(project.renderedImage);
            hasInitialGenerated.current = true;
            return;
        }

        hasInitialGenerated.current = true;
        void runGeneration(project);
    }, [project, isProjectLoading]);

    return (
        <div className="visualizer">
            <nav className="topbar">
                <div className="brand">
                    <Box className="logo"/>
                    <span className="name">Roomify</span>
                </div>
                <Button variant="ghost" size="sm" onClick={handleBack} className="exit">
                    <X className="icon"/> Exit Editor
                </Button>
            </nav>

            <section className="content">
                <div className="panel">
                    <div className="panel-header">
                        <div className="panel-meta">
                            <p>Project</p>
                            <h2>{project?.name || `Residence ${id}`}</h2>
                            <p className="note">Created by You</p>
                        </div>

                        <div className="panel-actions">
                            <Button
                                size="sm"
                                onClick={() => {
                                }}
                                className="export"
                                disabled={!currentImage}
                            >
                                <Download className="w-4 h-4 mr-2"/> Export
                            </Button>
                            <Button size="sm" onClick={() => {
                            }} className="share">
                                <Share2 className="w-4 h-4 mr-2"/>
                                Share
                            </Button>
                        </div>
                    </div>

                    <div className={`render-area ${isProcessing ? 'is-processing' : ''}`}>
                        {currentImage ? (
                            <img src={currentImage} alt="AI Render"
                                 className="render-img"/>
                        ) : (
                            <div className="render-placeholder">
                                {project?.sourceImage && (
                                    <img src={project?.sourceImage} alt="Original"
                                         className="render-fallback"/>
                                )}
                            </div>
                        )}

                        {isProcessing && (
                            <div className="render-overlay">
                                <div className="rendering-card">
                                    <RefreshCcw className="sppiner"/>
                                    <span className="title">Rendering...</span>
                                    <span className="subtitle">Generating your 3D visualization</span>
                                </div>
                            </div>
                        )}

                        {!isProcessing && renderError && (
                            <div className="render-error">
                                {renderError}
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    )
}
export default VisualizerId
