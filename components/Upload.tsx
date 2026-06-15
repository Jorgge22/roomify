import React, {useCallback, useEffect, useState} from 'react'
import {useOutletContext} from "react-router";
import {CheckCircle2, ImageIcon, UploadIcon} from "lucide-react";
import {PROGRESS_INCREMENT, PROGRESS_INTERVAL_MS, REDIRECT_DELAY_MS} from "../lib/constants";

interface UploadProps {
    onComplete?: (base64Data: string) => void;
}

const Upload = ({onComplete}: UploadProps) => {
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [progress, setProgress] = useState(0);
    const [hasMounted, setHasMounted] = useState(false);

    const {isSignedIn} = useOutletContext<AuthContext>()
    const canUpload = hasMounted && (isSignedIn || import.meta.env.DEV);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    const processFile = useCallback((file: File) => {
        if (!canUpload) return;

        setFile(file);
        setProgress(0);

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64Data = reader.result as string;

            const interval = setInterval(() => {
                setProgress((prev) => {
                    const next = prev + PROGRESS_INCREMENT;
                    if (next >= 100) {
                        clearInterval(interval);
                        setTimeout(() => {
                            onComplete?.(base64Data);
                        }, REDIRECT_DELAY_MS);
                        return 100;
                    }
                    return next;
                });
            }, PROGRESS_INTERVAL_MS);
        };
        reader.readAsDataURL(file);
    }, [canUpload, onComplete]);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        if (!canUpload) return;
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        if (!canUpload) return;

        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && droppedFile.type.startsWith('image/')) {
            processFile(droppedFile);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!canUpload) return;

        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            processFile(selectedFile);
        }
    }

    return (
        <div className="upload">
            {!file ? (
                <div className={`dropzone ${isDragging ? 'is-dragging' : ''}`}>
                    <input
                        type="file"
                        className="drop-input"
                        accept=".jpg, .jpeg, .png"
                        onChange={handleChange}
                    />

                    <div className="drop-content">
                        <div className="drop-icon">
                            <UploadIcon size={20}/>
                        </div>
                        <p>
                            {canUpload ? (
                                "Click to upload or just drag and drop"
                            ) : ("Sign in or sing up with Puter to upload")}
                        </p>
                        <p className="help">
                            Maximun file size 50 MB.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="upload-status">
                    <div className="status-content">
                        <div className="status-icon">
                            {progress == 100 ? (
                                <CheckCircle2 className="check"/>
                            ) : (
                                <ImageIcon className="image"/>
                            )}
                        </div>

                        <h3>{file.name}</h3>

                        <div className="progress">
                            <div className="bar" style={{width: `${progress}%`}}/>

                            <p className="status-text">
                                {progress < 100 ? 'Analyzing Floor Plan...' : 'Redirecting...'}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
export default Upload
