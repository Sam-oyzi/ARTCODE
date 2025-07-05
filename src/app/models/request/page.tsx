import { RequestForm } from "./request-form";

export default function ModelRequestPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <div className="max-w-2xl mx-auto w-full">
        <div className="text-center mb-8">
          <h1 className="font-semibold text-2xl md:text-3xl">Request a 3D Model</h1>
          <p className="text-muted-foreground mt-2">
            Describe your vision, and our AI will help refine it for our creators.
          </p>
        </div>
        <RequestForm />
      </div>
    </div>
  );
}
