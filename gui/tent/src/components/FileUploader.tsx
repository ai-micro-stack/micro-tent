import { useEffect, useState } from "react";
import { ProgressBar, Form, Alert, Button } from "react-bootstrap";
import axios from "axios";
import type { FileChange } from "@/types/Event";

const { VITE_API_SCHEME, VITE_API_SERVER, VITE_API_PORT } = import.meta.env;
const urlPort =
  !VITE_API_PORT ||
  (VITE_API_SCHEME === "http" && VITE_API_PORT === "80") ||
  (VITE_API_SCHEME === "https" && VITE_API_PORT === "443")
    ? ""
    : `:${VITE_API_PORT}`;
const backend = `${VITE_API_SCHEME}://${VITE_API_SERVER}${urlPort}/stackupload`;

type FileState = {
  fileSize: number;
  fileId: string;
  totalChunks: number;
  totalChunksUploaded: number;
  startChunk: number;
  endChunk: number;
  fileToUpload: File | null;
  uploadedBytes: number;
  uploadStatus: number;
};

type FileDownloaderProps = {
  completeNotifier: (fc: FileChange) => void;
  channelParam?: string;
  allowedTypes?: string[];
  receiverUrl?: string;
};

function FileUploader({
  completeNotifier,
  channelParam,
  allowedTypes,
  receiverUrl,
}: FileDownloaderProps) {
  const channel = channelParam !== undefined ? `/${channelParam}` : "";
  const backendUrl = receiverUrl !== undefined ? receiverUrl : backend;
  const allowedFiles = allowedTypes !== undefined ? allowedTypes : [];
  const chunkSize = 1048576 * 10;
  const [showProgress, setShowProgress] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errMsg, setErrMsg] = useState<string[]>([]);
  const [showAlert, setShowAlert] = useState(false);
  const initialState: FileState = {
    fileSize: 0,
    fileId: "",
    totalChunks: 0,
    totalChunksUploaded: 0,
    startChunk: 0,
    endChunk: chunkSize,
    fileToUpload: null,
    uploadedBytes: 0,
    uploadStatus: 0,
  };
  const [fileState, setFileState] = useState(initialState);

  const progressInstance = (
    <ProgressBar animated now={progress} label={`${progress.toFixed(3)}%`} />
  );

  useEffect(
    () => {
      if (fileState.fileToUpload && fileState.uploadStatus % 2 === 0) {
        fileUpload(fileState.totalChunksUploaded);
      }
    },
    // eslint-disable-next-line
    [
      fileState.totalChunksUploaded,
      fileState.fileToUpload,
      fileState.uploadStatus,
    ]
  );

  const getFileContext = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files: FileList | null = e.target.files;
    if (!files) return;
    const file_obj: File = files[0];

    if (
      allowedFiles &&
      !allowedFiles.includes(file_obj.name.split(".").pop() ?? "*")
    ) {
      alert("Allowed file type: " + allowedFiles);
      return;
    }

    if (!file_obj.size) {
      alert("Can not upload empty file!");
      return;
    }

    const fileId = `${file_obj.name}.${file_obj.size}-${file_obj.lastModified}`;
    setShowProgress(true);
    setProgress(0);
    resetState();
    axios
      .get(`${backendUrl}/status${channel}`, {
        headers: {
          "x-file-name": fileId,
          "file-size": file_obj.size,
        },
      })
      .then(({ data }) => {
        const uploadedBytes = data.uploaded;
        console.log("uploaded bbytes ", uploadedBytes);
        const bytesRemaining = file_obj.size - uploadedBytes;
        const endingChunk = Math.min(uploadedBytes + chunkSize, file_obj.size);
        setFileState({
          fileSize: file_obj.size,
          fileId,
          totalChunks: Math.ceil(bytesRemaining / chunkSize),
          totalChunksUploaded: 0,
          startChunk: uploadedBytes,
          endChunk:
            endingChunk === fileState.fileSize ? endingChunk + 1 : endingChunk,
          fileToUpload: file_obj,
          uploadedBytes,
          uploadStatus: 0,
        });
      })
      .catch((error) => {
        setErrMsg([
          error.message,
          error.status === 403
            ? "--- You don't have permission to make this operation."
            : "",
        ]);
        setShowAlert(true);
        console.error("Status call failed ", error);
      });
  };

  const fileUpload = (totalChunksUploaded: number) => {
    const { totalChunks, fileToUpload, startChunk, endChunk, fileId } =
      fileState;
    if (totalChunksUploaded < totalChunks) {
      const chunk: Blob | undefined = fileToUpload?.slice(startChunk, endChunk);
      uploadChunk(chunk);
    } else {
      axios
        .post(
          `${backendUrl}/complete${channel}`,
          {},
          {
            headers: {
              "Access-Control-Allow-Origin": "*",
              "x-file-name": fileId,
            },
          }
        )
        .then(uploadComplete);
    }
  };

  const uploadChunk = (chunk: Blob | undefined) => {
    console.table({ ...fileState, fileToUpload: null });
    const {
      fileId,
      startChunk,
      endChunk,
      fileSize,
      totalChunksUploaded,
      uploadedBytes,
    } = fileState;
    axios
      .post(`${backendUrl}/file${channel}`, chunk, {
        headers: {
          "Content-Type": "application/x-binary",
          "Access-Control-Allow-Origin": "*",
          "x-file-name": fileId,
          "Content-Range": `bytes ${startChunk}-${endChunk}/${fileSize}`,
          "file-size": fileSize,
        },
      })
      .then(() => {
        const endingChunk = Math.min(endChunk + chunkSize, fileSize);

        setFileState({
          ...fileState,
          totalChunksUploaded: totalChunksUploaded + 1,
          startChunk: endChunk,
          endChunk: endingChunk === fileSize ? endingChunk + 1 : endingChunk,
          uploadedBytes: endingChunk,
        });
        const prog = fileSize ? (uploadedBytes / fileSize) * 100 : 0.1;
        setProgress(prog);
      });
  };

  const uploadComplete = () => {
    setFileState({
      ...fileState,
      uploadStatus: fileState.uploadStatus | 1,
    });
    completeNotifier({
      file: fileState.fileId.split(".").slice(0, -1).join("."),
      change: "+",
    });
  };

  const resetState = () => {
    setFileState({
      fileSize: 0,
      fileId: "",
      totalChunks: 0,
      totalChunksUploaded: 0,
      startChunk: 0,
      endChunk: chunkSize,
      fileToUpload: null,
      uploadedBytes: 0,
      uploadStatus: 0,
    });
  };

  return (
    <div>
      <div className="jumbotron">
        <Form>
          <Form.Group>
            <Form.Control
              id="fileSelector"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                getFileContext(e);
              }}
              type="file"
            />
          </Form.Group>
          <Form.Group style={{ display: showProgress ? "block" : "none" }}>
            {progressInstance}
          </Form.Group>
        </Form>
      </div>
      {showAlert ? (
        <Alert
          className="mb-2"
          variant="danger"
          onClose={() => setShowAlert(false)}
          dismissible
        >
          {errMsg?.join(" ") ?? "An unknown error."}
        </Alert>
      ) : (
        <div />
      )}
    </div>
  );
}

export const FileDownloader = ({
  fileName,
  channelParam,
  receiverUrl,
  bunttonText,
  className,
  variant,
  size,
}: {
  fileName: string;
  channelParam?: string;
  receiverUrl?: string;
  bunttonText?: string;
  className?: string;
  variant?: string;
  size?: "sm" | "lg" | undefined;
}) => {
  const channel = channelParam !== undefined ? `${channelParam}` : "";
  const backendUrl = receiverUrl !== undefined ? receiverUrl : backend;
  const fileUrl = `${backendUrl}/file/${channel}/${fileName}`;
  const handleDownload = () => {
    fetch(fileUrl)
      .then((response) => response.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(new Blob([blob]));
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName || "downloaded-file";
        document.body.appendChild(link);

        link.click();

        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      })
      .catch((error) => {
        console.error("Error fetching the file:", error);
      });
  };

  return (
    <Button
      className={className ?? "remove-btn float-end"}
      variant={variant ?? "success"}
      size={size}
      value="download"
      onClick={handleDownload}
    >
      {bunttonText ?? "Download"}
    </Button>
  );
};

export default FileUploader;
