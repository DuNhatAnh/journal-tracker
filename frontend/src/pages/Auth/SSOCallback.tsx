import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";

export default function SSOCallback() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    const userStr = params.get("user");
    const isNew = params.get("is_new");

    if (token && userStr) {
      try {
        // Save to localStorage
        localStorage.setItem("token", token);
        
        // Parse and validate user object
        const decodedUser = decodeURIComponent(userStr);
        const user = JSON.parse(decodedUser);
        localStorage.setItem("user", JSON.stringify(user));

        if (isNew === "1") {
          localStorage.setItem("show_role_selection", "true");
        }

        // Redirect to dashboard
        navigate("/dashboard", { replace: true });
      } catch (err) {
        console.error("SSO Callback Parsing Error:", err);
        navigate("/login?error=" + urlEncode("Lỗi định dạng dữ liệu đăng nhập."), { replace: true });
      }
    } else {
      navigate("/login?error=" + urlEncode("Thông tin xác thực SSO không đầy đủ."), { replace: true });
    }
  }, [location, navigate]);

  const urlEncode = (str: string) => encodeURIComponent(str);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden transition-colors duration-500">
      {/* Background Decor */}
      <div className="absolute top-[-10%] right-[-5%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="glass-panel p-8 rounded-2xl max-w-sm w-full space-y-6 text-center relative z-10">
        <div className="flex justify-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
        </div>
        <div className="space-y-2">
          <h2 className="font-display text-xl font-bold text-on-surface">Đang đồng bộ đăng nhập</h2>
          <p className="text-on-surface-variant text-sm">Vui lòng chờ trong giây lát để hệ thống xác thực tài khoản Google của bạn...</p>
        </div>
      </div>
    </div>
  );
}
