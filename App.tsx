import { useState, useRef } from "react";
import axios from "axios";
import { Hero } from "./components/Hero";
import { ResumeForm, FormValues } from "./components/ResumeForm";
import { LoadingOverlay } from "./components/LoadingOverlay";
import { SuccessOverlay } from "./components/SuccessOverlay";

function App() {
  const [started, setStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resumeHtml, setResumeHtml] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const handleStart = () => {
    setStarted(true);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleSubmit = async (data: FormValues) => {
    setIsLoading(true);
    setResumeHtml(null);
    setPdfUrl(null);

    try {
      // Sending data to the n8n webhook
      const response = await axios.post(
        "https://resumebuilder1.app.n8n.cloud/webhook/8c1d98d5-960e-455a-b060-9c917fe88050",
        data
      );

      console.log("Webhook Response:", response.data);

      let htmlContent = "";
      let fetchedPdfUrl = null;

      // Handle array response (common with "allIncomingItems" in n8n)
      const responseData = Array.isArray(response.data) ? response.data[0] : response.data;

      // Extract HTML
      if (responseData.html) {
        htmlContent = responseData.html;
      } else if (responseData.output) {
        htmlContent = responseData.output;
      } else if (typeof responseData === 'string') {
        htmlContent = responseData;
      }

      // Extract PDF URL if available
      if (responseData.pdfUrl) {
        fetchedPdfUrl = responseData.pdfUrl;
      } else if (responseData.url) {
        fetchedPdfUrl = responseData.url;
      } else if (responseData.data && typeof responseData.data === 'string' && responseData.data.startsWith('http')) {
        fetchedPdfUrl = responseData.data;
      }

      if (htmlContent) {
        setResumeHtml(htmlContent);
        setPdfUrl(fetchedPdfUrl);
      } else {
        console.warn("No HTML content found in response");
        alert("The AI generated a response, but we couldn't parse the resume content. Please try again.");
      }

    } catch (error) {
      console.error("Error generating resume:", error);
      alert("Something went wrong while communicating with the AI service. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResumeHtml(null);
    setPdfUrl(null);
    setStarted(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-navy-950 text-slate-200 font-sans selection:bg-gold-400/30 selection:text-gold-100">
      <Hero onStart={handleStart} />
      
      {started && (
        <div ref={formRef} className="relative z-10 bg-navy-950 min-h-screen border-t border-white/5">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gold-400/50 to-transparent" />
          <ResumeForm onSubmit={handleSubmit} isSubmitting={isLoading} />
        </div>
      )}

      <LoadingOverlay isOpen={isLoading} />
      
      {resumeHtml && (
        <SuccessOverlay 
          isOpen={true} 
          resumeHtml={resumeHtml} 
          pdfUrl={pdfUrl}
          onReset={handleReset} 
        />
      )}
    </div>
  );
}

export default App;
