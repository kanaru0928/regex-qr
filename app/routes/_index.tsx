/* eslint-disable jsx-a11y/media-has-caption */
import {
  json,
  type LoaderFunctionArgs,
  type MetaFunction,
} from "@remix-run/node";
import {
  Form,
  useLoaderData,
  useSearchParams,
  useSubmit,
} from "@remix-run/react";
import jsQR from "jsqr";
import { useCallback, useEffect, useRef, useState } from "react";

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const regexParam = url.searchParams.get("re");
  return json({ regexParam });
};

export default function Index() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [text, setText] = useState<string>("Capture the QR code");
  const { regexParam } = useLoaderData<typeof loader>();
  const submit = useSubmit();

  useEffect(() => {
    const field = document.getElementById("regex");
    if (field instanceof HTMLInputElement) {
      field.value = regexParam || "";
    }
  }, [regexParam]);

  const scan = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (!canvas || !video) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);

    if (code) {
      setText(code.data);
    } else {
      setText("");
    }

    setTimeout(scan, 100);
  }, []);

  useEffect(() => {
    const constraints = {
      video: {
        facingMode: "environment",
        width: { ideal: 1024 },
        height: { ideal: 1024 },
      },
    };

    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      })
      .catch((error) => {
        console.error("Error accessing media devices.", error);
      });

    scan();

    const currentVideoRef = videoRef.current;

    return () => {
      if (currentVideoRef && currentVideoRef.srcObject) {
        const stream = currentVideoRef.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [scan]);

  const extract = (text: string) => {
    const regex = document.getElementById("regex") as HTMLInputElement;
    if (!regex) {
      return "";
    }
    const pattern = new RegExp(regex.value);
    return text.replace(pattern, "$1");
  };

  return (
    <div className="flex justify-center">
      <div className="flex flex-col gap-5 h-screen max-w-full">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="max-h-[calc(100%-10em)]"
        />
        <p className="z-10 text-5xl font-bold text-center">{extract(text)}</p>
        <div className="flex gap-3 items-baseline">
          <Form method="get" onChange={(e) => submit(e.currentTarget)}>
            <p>Regex:</p>
            <input
              type="text"
              name="re"
              defaultValue={regexParam || ""}
              id="regex"
              className="border px-3 py-2 rounded-full flex-1"
            />
          </Form>
        </div>
      </div>
      <canvas
        className="hidden"
        width={1024}
        height={1024}
        ref={canvasRef}
      ></canvas>
    </div>
  );
}
