import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Camera, 
  Fingerprint, 
  Home, 
  Users, 
  ArrowRight, 
  CheckCircle,
  AlertCircle,
  Activity,
  RefreshCcw,
  X,
  Droplet
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { apiService } from '../services/apiService';
import { cn } from '../lib/utils';

export default function PatientRegistration() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registeredPatient, setRegisteredPatient] = useState<any>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    gender: 'male' as 'male' | 'female' | 'other',
    dob: '',
    age: '',
    bloodGroup: 'A+',
    address: '',
    fingerprintId: '',
    nextOfKinName: '',
    nextOfKinPhone: '',
    nextOfKinRelationship: '',
    status: 'outpatient' as 'inpatient' | 'outpatient',
    triagePriority: 'ESI-3',
    nextVisit: ''
  });

  // Biometric State
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [qualityError, setQualityError] = useState<string | null>(null);
  const [fingerprintStatus, setFingerprintStatus] = useState<'idle' | 'scanning' | 'success'>('idle');
  const [enrolledFingerprintId, setEnrolledFingerprintId] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const validateImage = (context: CanvasRenderingContext2D, width: number, height: number) => {
    const imageData = context.getImageData(0, 0, width, height);
    const data = imageData.data;
    let brightness = 0;
    let variance = 0;
    let prevIntensity = 0;

    // Sample pixels for brightness and sharpness estimation
    const skip = 32; 
    let count = 0;
    for (let i = 0; i < data.length; i += 4 * skip) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const intensity = (r + g + b) / 3;
      brightness += intensity;
      
      if (i > 0) {
        variance += Math.abs(intensity - prevIntensity);
      }
      prevIntensity = intensity;
      count++;
    }

    const avgBrightness = brightness / count;
    const sharpness = variance / count;

    // More lenient thresholds for simulated environment
    if (avgBrightness < 10) return { valid: false, reason: "Too dark. Please improve lighting." };
    if (avgBrightness > 250) return { valid: false, reason: "Too bright. Please reduce glare." };
    if (sharpness < 2) return { valid: false, reason: "Image blurry. Hold camera steady." };

    return { valid: true };
  };

  const startCamera = async () => {
    setIsCameraActive(true);
    setQualityError(null);
    setError(null);
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("Biometric capture requires a secure connection (HTTPS) and camera support.");
      setIsCameraActive(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user" }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(e => {
            console.error("Video play failed:", e);
            setError("Failed to start video stream.");
          });
        };
      }
    } catch (err: any) {
      console.error("Camera error details:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError("Camera permission denied. Please allow camera access in your browser settings.");
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError("No camera device found.");
      } else {
        setError(`Unable to access camera: ${err.message || 'Unknown error'}`);
      }
      setIsCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d', { willReadFrequently: true });
      if (context) {
        const width = videoRef.current.videoWidth;
        const height = videoRef.current.videoHeight;
        canvasRef.current.width = width;
        canvasRef.current.height = height;
        context.drawImage(videoRef.current, 0, 0, width, height);
        
        const quality = validateImage(context, width, height);
        
        if (!quality.valid) {
          setQualityError(quality.reason || "Poor image quality");
          return;
        }

        const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.8);
        setCapturedPhoto(dataUrl);
        setQualityError(null);
        stopCamera();
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraActive(false);
    }
  };

  const scanningTimerRef = useRef<NodeJS.Timeout | null>(null);

  const simulateFingerprint = () => {
    if (fingerprintStatus !== 'idle') return;
    
    setFingerprintStatus('scanning');
    
    // Clear any existing timer
    if (scanningTimerRef.current) clearTimeout(scanningTimerRef.current);
    
    // Simulate a complex biometric analysis process
    scanningTimerRef.current = setTimeout(() => {
      // Auto-generate a unique biometric token for the simulation
      const simulatedId = `BIO_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      setEnrolledFingerprintId(simulatedId);
      setFingerprintStatus('success');
      
      // Auto-populate the fingerprintId field as well for visibility
      setFormData(prev => ({ ...prev, fingerprintId: simulatedId }));
      scanningTimerRef.current = null;
    }, 2000);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const patient = await apiService.registerPatient({
        ...formData,
        age: parseInt(formData.age),
        photoUrl: capturedPhoto || undefined,
        fingerprint: enrolledFingerprintId || formData.fingerprintId || undefined
      });
      setRegisteredPatient(patient);
      setStep(4);
    } catch (err: any) {
      setError(err.message || "Registration failed. Please ensure all required fields are filled.");
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in px-2 sm:px-4 py-4 sm:py-8">
      {/* Background Hero Header */}
      <div
        className="relative rounded-3xl overflow-hidden p-6 sm:p-8 bg-cover bg-center text-white shadow-xl"
        style={{ backgroundImage: `url('https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=1600')` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/80 to-blue-950/70 backdrop-blur-xs"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-bold uppercase tracking-wider mb-2">
              <User size={14} /> Registration & Record Desk
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Patient Registration</h1>
            <p className="text-blue-100/80 font-medium text-xs sm:text-sm mt-1">
              VIVO Medical Center • Digital Admissions & Patient Folder Creation
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md p-2.5 rounded-2xl border border-white/10 self-start md:self-auto">
             {[1, 2, 3].map(i => (
               <div key={i} className={cn(
                 "w-8 sm:w-10 h-2.5 rounded-full transition-all duration-300",
                 step >= i ? "bg-blue-400 shadow-sm" : "bg-white/20"
               )} />
             ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl shadow-gray-100 border border-gray-100 overflow-hidden">
        {error && (
          <div className="bg-red-50 p-4 border-b border-red-100 flex items-center gap-3 text-red-600 font-bold text-sm">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {/* Step 1: Identity */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <User size={14} className="text-blue-500" /> Basic Information
                </label>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Full Legal Name"
                    className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-100 text-lg font-bold"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                  <div className="flex gap-4">
                    <input
                      type="date"
                      className="flex-1 p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-100 font-bold"
                      value={formData.dob}
                      onChange={(e) => setFormData({...formData, dob: e.target.value})}
                    />
                    <input
                      type="number"
                      placeholder="Age"
                      className="w-24 p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-100 font-bold"
                      value={formData.age}
                      onChange={(e) => setFormData({...formData, age: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <select 
                      className="p-4 bg-gray-50 rounded-2xl outline-none font-bold"
                      value={formData.gender}
                      onChange={(e) => setFormData({...formData, gender: e.target.value as any})}
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                    <div className="relative">
                       <Droplet size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500" />
                       <select 
                        className="w-full p-4 pl-12 bg-gray-50 rounded-2xl outline-none font-bold"
                        value={formData.bloodGroup}
                        onChange={(e) => setFormData({...formData, bloodGroup: e.target.value})}
                      >
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                          <option key={bg} value={bg}>{bg}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                 <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Home size={14} className="text-blue-500" /> Residential & Status
                </label>
                <textarea
                  placeholder="Street Address, City, State"
                  className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-100 font-bold h-32 resize-none"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                />
                
                <div className="space-y-4">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Fingerprint size={14} className="text-blue-500" /> Fingerprint ID (Optional)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter device-specific Biometric ID"
                      className="flex-1 p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-100 font-bold"
                      value={formData.fingerprintId}
                      onChange={(e) => setFormData({...formData, fingerprintId: e.target.value})}
                    />
                    <button 
                      type="button"
                      onClick={() => setStep(2)}
                      className="px-6 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-100 transition-all flex items-center gap-2 font-black text-[10px] uppercase tracking-widest shadow-sm"
                    >
                      <Fingerprint size={16} /> Scan
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                   {(['outpatient', 'inpatient'] as const).map(s => (
                     <button
                        key={s}
                        type="button"
                        onClick={() => setFormData({...formData, status: s})}
                        className={cn(
                          "flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest border-2 transition-all",
                          formData.status === s ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-100 text-gray-400 hover:border-gray-200"
                        )}
                     >
                       {s}
                     </button>
                   ))}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <AlertCircle size={14} className="text-red-500" /> Triage Level (Emergency Index)
                  </label>
                  <select
                    className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold text-xs"
                    value={formData.triagePriority}
                    onChange={(e) => setFormData({...formData, triagePriority: e.target.value})}
                  >
                    <option value="ESI-1">ESI Level 1 - Resuscitation (Immediate Life-saving)</option>
                    <option value="ESI-2">ESI Level 2 - Emergent (High Risk / Confusion / Severe Pain)</option>
                    <option value="ESI-3">ESI Level 3 - Urgent (Multiple Resources Needed)</option>
                    <option value="ESI-4">ESI Level 4 - Less Urgent (One Resource Needed)</option>
                    <option value="ESI-5">ESI Level 5 - Non-Urgent (No Resources Needed)</option>
                  </select>
                </div>
                {formData.status === 'outpatient' && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-normal">
                      Appointment scheduling is managed by clinical staff during the consultation.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-8">
              <button 
                onClick={nextStep}
                disabled={!formData.name || !formData.dob}
                className="bg-gray-900 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-gray-800 disabled:opacity-30 transition-all shadow-xl"
              >
                Identification <ArrowRight size={20} />
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Biometrics */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* Photo Capture */}
              <div className="space-y-4">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Camera size={14} className="text-blue-500" /> Facial Mapping
                </label>
                <div className="aspect-[4/3] bg-gray-100 rounded-3xl overflow-hidden relative border-4 border-gray-50">
                  {isCameraActive ? (
                    <>
                      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                      {qualityError && (
                        <div className="absolute top-4 inset-x-4 bg-red-600/90 backdrop-blur-sm text-white p-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 animate-bounce">
                          <AlertCircle size={14} /> {qualityError}
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-4 flex justify-center gap-4">
                        <button 
                          onClick={stopCamera}
                          className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-all"
                        >
                          <X size={24} />
                        </button>
                        <button 
                           type="button"
                           onClick={capturePhoto} 
                           className="p-4 bg-white rounded-full shadow-2xl text-blue-600 hover:scale-110 active:scale-95 transition-all"
                         >
                          <CheckCircle size={32} />
                        </button>
                      </div>
                    </>
                  ) : capturedPhoto ? (
                    <div className="relative w-full h-full group">
                      <img src={capturedPhoto} className="w-full h-full object-cover" alt="Captured" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                        <button 
                          type="button"
                          onClick={() => { setCapturedPhoto(null); startCamera(); }} 
                          className="px-6 py-3 bg-white text-gray-900 rounded-2xl font-black text-sm flex items-center gap-2 hover:scale-105 transition-all"
                        >
                          <RefreshCcw size={18} /> Retake Photo
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                       <div className="p-6 bg-white rounded-full shadow-xl text-blue-600">
                          <Camera size={40} />
                       </div>
                       <button 
                         type="button"
                         onClick={startCamera} 
                         className="text-sm font-black text-blue-600 hover:underline"
                       >
                         Launch Camera
                       </button>
                    </div>
                  )}
                  <canvas ref={canvasRef} className="hidden" />
                </div>
              </div>

              {/* Fingerprint Capture */}
              <div className="space-y-4">
                 <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Fingerprint size={14} className="text-blue-500" /> Biometric Identity
                </label>
                <div 
                  onClick={() => fingerprintStatus === 'idle' && simulateFingerprint()}
                  className={cn(
                    "aspect-[4/3] rounded-3xl flex flex-col items-center justify-center gap-6 border-4 border-dashed transition-all relative overflow-hidden",
                    fingerprintStatus === 'idle' ? "bg-gray-50 border-gray-200 cursor-pointer hover:bg-blue-50/50 hover:border-blue-300 group" :
                    fingerprintStatus === 'scanning' ? "bg-blue-50 border-blue-200" : "bg-green-50 border-green-200"
                  )}
                >
                  {/* Scanning Animation Line */}
                  <AnimatePresence>
                    {fingerprintStatus === 'scanning' && (
                      <motion.div 
                        initial={{ top: '0%' }}
                        animate={{ top: '100%' }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-x-0 h-1 bg-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)] z-10"
                      />
                    )}
                  </AnimatePresence>

                  <motion.div
                    animate={fingerprintStatus === 'scanning' ? {
                      scale: [1, 1.05, 1],
                      opacity: [0.5, 1, 0.5]
                    } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                    className={cn(
                      "p-8 rounded-full shadow-2xl relative z-0",
                      fingerprintStatus === 'idle' ? "bg-white text-gray-300" :
                      fingerprintStatus === 'scanning' ? "bg-blue-600 text-white" : "bg-green-600 text-white"
                    )}
                  >
                    <Fingerprint size={64} />
                    {fingerprintStatus === 'success' && (
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-2 -right-2 bg-white text-green-600 rounded-full p-1"
                      >
                        <CheckCircle size={24} />
                      </motion.div>
                    )}
                  </motion.div>

                  <div className="text-center space-y-4">
                    <p className={cn(
                      "font-black text-sm uppercase tracking-widest",
                      fingerprintStatus === 'idle' ? "text-gray-400" :
                      fingerprintStatus === 'scanning' ? "text-blue-600" : "text-green-600"
                    )}>
                      {fingerprintStatus === 'idle' ? "Scanner Standby" :
                       fingerprintStatus === 'scanning' ? "Capturing Ridge Patterns..." : "Identity Enrolled"}
                    </p>

                    {fingerprintStatus === 'success' && enrolledFingerprintId && (
                      <p className="text-[10px] font-black text-gray-400 font-mono bg-gray-100 px-3 py-1 rounded-full inline-block">
                        TOKEN: {enrolledFingerprintId}
                      </p>
                    )}

                    {fingerprintStatus === 'idle' ? (
                      <div className="space-y-3">
                        <button 
                          type="button"
                          onClick={(e) => { e.stopPropagation(); simulateFingerprint(); }}
                          className="w-full px-8 py-3 bg-gray-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2"
                        >
                          <Fingerprint size={16} /> Begin Enrollment
                        </button>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Ensure scanner is clean and dry</p>
                      </div>
                    ) : fingerprintStatus === 'success' ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 justify-center">
                           <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                           <p className="text-[10px] font-black text-green-600 uppercase tracking-widest">Biometric Data Securely Stored</p>
                        </div>
                        <button 
                          onClick={() => { setFingerprintStatus('idle'); setEnrolledFingerprintId(null); }}
                          className="text-xs font-bold text-gray-400 flex items-center gap-1 mx-auto hover:text-gray-900 transition-colors"
                        >
                          <RefreshCcw size={12} /> Clear and Rescan
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-8">
              <button 
                onClick={prevStep}
                className="px-8 py-4 text-gray-500 font-black hover:text-gray-900 transition-all"
              >
                Go Back
              </button>
              <button 
                onClick={nextStep}
                className="bg-gray-900 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 shadow-xl"
              >
                Proceed to Contacts <ArrowRight size={20} />
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Next of Kin */}
        {step === 3 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-8 space-y-8">
            <div className="max-w-2xl mx-auto space-y-12">
               <div className="text-center space-y-2">
                  <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100">
                    <Users size={32} />
                  </div>
                  <h2 className="text-2xl font-black text-gray-900">Emergency Contacts</h2>
                  <p className="text-gray-500 font-medium">Add Next of Kin for rapid emergency response.</p>
               </div>

               <div className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Next of Kin Full Name</label>
                        <input
                          type="text"
                          className="w-full p-6 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-100 text-xl font-bold"
                          placeholder="Full Name"
                          value={formData.nextOfKinName}
                          onChange={(e) => setFormData({...formData, nextOfKinName: e.target.value})}
                        />
                    </div>
                    <div className="space-y-4">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Relationship</label>
                        <select
                          className="w-full p-6 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-100 text-xl font-bold appearance-none cursor-pointer"
                          value={formData.nextOfKinRelationship}
                          onChange={(e) => setFormData({...formData, nextOfKinRelationship: e.target.value})}
                        >
                          <option value="">Select Relationship</option>
                          <option value="Spouse">Spouse</option>
                          <option value="Parent">Parent</option>
                          <option value="Child">Child</option>
                          <option value="Sibling">Sibling</option>
                          <option value="Guardian">Guardian</option>
                          <option value="Friend">Friend</option>
                          <option value="Other">Other</option>
                        </select>
                    </div>
                 </div>
                 <div className="space-y-4">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Contact Phone Number</label>
                    <input
                      type="tel"
                      className="w-full p-6 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-100 text-xl font-bold"
                      placeholder="+234 [0] 00 000 0000"
                      value={formData.nextOfKinPhone}
                      onChange={(e) => setFormData({...formData, nextOfKinPhone: e.target.value})}
                    />
                 </div>
               </div>
            </div>

            <div className="flex justify-between pt-8 border-t">
              <button 
                onClick={prevStep}
                className="px-8 py-4 text-gray-500 font-black"
              >
                 Edit Biometrics
              </button>
              <button 
                onClick={handleSubmit}
                disabled={loading || !formData.nextOfKinName}
                className="bg-blue-600 text-white px-12 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50 transition-all shadow-xl shadow-blue-100"
              >
                {loading ? "Registering..." : "Finalize Admission"}
                <CheckCircle size={20} />
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 4: Success & Routing */}
        {step === 4 && registeredPatient && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="p-12 text-center space-y-8">
            <div className="w-24 h-24 bg-green-100 text-green-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-lg shadow-green-50">
              <CheckCircle size={48} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-gray-900 mb-2">Registration Complete</h2>
              <p className="text-gray-500 font-medium max-w-sm mx-auto italic">Patient {registeredPatient.name} has been successfully enrolled in the system.</p>
            </div>
            
            <div className="flex flex-col gap-4 max-w-sm mx-auto pt-4">
              <button 
                onClick={async () => {
                  try {
                    await apiService.updatePatientWorkflowStatus(registeredPatient.id, 'vitals');
                  } catch (e) { console.error(e); }
                  navigate('/vitals-record');
                }}
                className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black shadow-xl shadow-emerald-100 hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
              >
                <Activity size={20} /> Send to Nurses (Vitals)
              </button>
              <button
                onClick={async () => {
                  try {
                    await apiService.updatePatientWorkflowStatus(registeredPatient.id, 'consultation');
                  } catch (e) { console.error(e); }
                  navigate('/patients');
                }}
                className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-100 hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
              >
                <User size={20} /> Send to Doctor (Consultation)
              </button>
              <button 
                onClick={() => navigate(`/patients/${registeredPatient.id}`)}
                className="w-full py-5 bg-gray-50 text-gray-500 rounded-2xl font-black hover:bg-gray-100 transition-all"
              >
                View Patient File
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="w-full py-4 text-sm font-bold text-blue-600 hover:underline"
              >
                Register Another Patient
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
