import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2, ArrowLeft } from "lucide-react";
import { api } from "../../lib/api";

export default function VerifyEmail() {
  const { id, hash } = useParams<{ id: string; hash: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Đang xác thực email của bạn...");

  useEffect(() => {
    let isMounted = true;
    
    const verifyEmail = async () => {
      try {
        const response = await api.get<{ message: string }>(`/email/verify/${id}/${hash}`);
        if (isMounted) {
          setStatus("success");
          setMessage(response.message || "Xác thực email thành công! Bạn có thể đăng nhập ngay bây giờ.");
        }
      } catch (err: any) {
        if (isMounted) {
          setStatus("error");
          setMessage(err.message || "Đường dẫn xác nhận không hợp lệ hoặc đã hết hạn.");
        }
      }
    };

    if (id && hash) {
      verifyEmail();
    } else {
      setStatus("error");
      setMessage("Đường dẫn không hợp lệ.");
    }

    return () => {
      isMounted = false;
    };
  }, [id, hash]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden transition-colors duration-500">
      <div className="absolute top-[-10%] right-[-5%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="glass-panel p-8 rounded-2xl max-w-sm w-full space-y-6 text-center relative z-10 animate-fade-in">
        <div className="flex justify-center">
          {status === "loading" && <Loader2 className="w-16 h-16 text-primary animate-spin" />}
          {status === "success" && <CheckCircle2 className="w-16 h-16 text-green-500 animate-bounce" />}
          {status === "error" && <XCircle className="w-16 h-16 text-error" />}
        </div>
        
        <div className="space-y-3">
          <h2 className="font-display text-2xl font-bold text-on-surface">
            {status === "loading" && "Đang xác thực"}
            {status === "success" && "Thành công!"}
            {status === "error" && "Xác thực thất bại"}
          </h2>
          <p className="text-on-surface-variant text-sm leading-relaxed">
            {message}
          </p>
        </div>

        {status !== "loading" && (
          <div className="pt-4">
            <Link to="/login" className="gradient-btn py-3 px-6 rounded-xl font-display font-bold text-sm uppercase tracking-widest text-on-primary inline-flex items-center gap-2 group">
              Đi tới Đăng nhập
              <ArrowLeft className="w-4 h-4 rotate-180 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
