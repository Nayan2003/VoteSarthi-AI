import { useState, useRef, useEffect } from "react";
import { User, LogOut, FileText, Smartphone, MapPin, X, Mail } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase/firebase";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export default function UserProfileMenu({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [vaultFiles, setVaultFiles] = useState([]);
  const [mobileNumber, setMobileNumber] = useState("");
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSignOut = () => {
    setIsOpen(false);
    signOut(auth);
  };

  const authFetch = async (url, options = {}) => {
    const token = await user.getIdToken();
    return fetch(`${BACKEND}${url}`, {
      ...options,
      headers: { Authorization: `Bearer ${token}`, ...options.headers },
    });
  };

  // Fetch files when menu opens to check verification status
  useEffect(() => {
    if (isOpen) {
      const loadFiles = async () => {
        try {
          const res = await authFetch("/api/vault/metadata");
          const data = await res.json();
          if (res.ok) setVaultFiles(data.files || []);
        } catch (err) {
          console.error("Failed to load vault for profile:", err);
        }
      };
      loadFiles();
    }
  }, [isOpen, user]);

  const aadhaarDoc = vaultFiles.find(f => (f.category || "") === "Aadhaar Card");
  const voterIdDoc = vaultFiles.find(f => (f.category || "") === "Voter ID");

  const hasAadhaar = !!aadhaarDoc;
  const hasVoterId = !!voterIdDoc;

  // Dynamic extracted info based on Vault uploads (from Vertex AI)
  const extractedInfo = {
    name: aadhaarDoc?.extractedInfo?.name || (hasAadhaar ? "Extraction pending..." : (user?.displayName || user?.email || "User")),
    voterId: voterIdDoc?.extractedInfo?.voterId || (hasVoterId ? "Extraction pending..." : "Not uploaded"),
    aadhaar: aadhaarDoc?.extractedInfo?.aadhaarNumber || (hasAadhaar ? "Extraction pending..." : "Not uploaded"),
    address: aadhaarDoc?.extractedInfo?.address || (hasAadhaar ? "Extraction pending..." : "—"),
    photoUrl: user?.photoURL || null
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 hover:ring-2 hover:ring-blue-500 transition overflow-hidden border border-slate-300 dark:border-slate-600"
        title="User Profile"
      >
        {extractedInfo.photoUrl ? (
          <img src={extractedInfo.photoUrl} alt="Profile" className="h-full w-full object-cover" />
        ) : (
          <User size={16} className="text-slate-600 dark:text-slate-300" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-10 w-72 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 p-4 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          
          <div className="flex items-center justify-between mb-3 border-b border-slate-200 dark:border-slate-800 pb-2">
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Profile Dashboard</span>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition">
              <X size={14} />
            </button>
          </div>

          <div className="flex flex-col items-center mb-4">
            <div className="h-16 w-16 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center overflow-hidden border-2 border-blue-500/50 mb-2 shadow-inner">
              {extractedInfo.photoUrl ? (
                <img src={extractedInfo.photoUrl} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <User size={32} className="text-slate-400" />
              )}
            </div>
            <div className="text-sm font-bold text-slate-800 dark:text-white text-center px-2 truncate w-full">
              {extractedInfo.name}
            </div>
            {hasVoterId ? (
              <div className="text-[10px] text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full mt-1 border border-blue-500/20 font-medium">
                Verified Voter
              </div>
            ) : (
              <div className="text-[10px] text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full mt-1 border border-amber-500/20 font-medium">
                Unverified (Upload Voter ID)
              </div>
            )}
          </div>

          <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-700/50 mb-4">
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                <FileText size={10} /> Voter ID Number
              </div>
              <div className="text-xs font-medium text-slate-700 dark:text-slate-200 pl-4">{extractedInfo.voterId}</div>
            </div>

            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                <FileText size={10} /> Aadhaar Number
              </div>
              <div className="text-xs font-medium text-slate-700 dark:text-slate-200 pl-4">{extractedInfo.aadhaar}</div>
            </div>

            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                <Smartphone size={10} /> Mobile (Manual Entry)
              </div>
              <input 
                type="text" 
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                placeholder="Enter mobile number"
                className="text-xs font-medium text-slate-700 dark:text-slate-200 bg-transparent border-b border-slate-300 dark:border-slate-600 focus:border-blue-500 outline-none ml-4 py-0.5 w-[85%]" 
              />
            </div>

            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                <MapPin size={10} /> Address
              </div>
              <div className="text-[11px] leading-snug font-medium text-slate-700 dark:text-slate-200 pl-4">{extractedInfo.address}</div>
            </div>

            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                <Mail size={10} /> Email ID
              </div>
              <div className="text-[11px] leading-snug font-medium text-slate-700 dark:text-slate-200 pl-4 truncate">{user?.email || "Not provided"}</div>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-50 dark:bg-red-950/30 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition border border-red-100 dark:border-red-900/30"
          >
            <LogOut size={12} /> Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
