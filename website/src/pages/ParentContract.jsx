import React, { useState } from 'react';
import { supabase, db } from '@/supabase/client';
import { auth } from '@/supabase/auth';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, ArrowLeft, CheckCircle, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import SignaturePad from '../components/contract/SignaturePad';
import {
  StudentInfoStep,
  ParentInfoStep,
  EmergencyContactsStep,
  MedicalInfoStep,
  PickupAuthorizationStep,
  FeesAndConsentStep,
  TermsAndConditionsStep
} from '../components/contract/ContractFormSteps';

const STEPS = [
  { id: 'student', label: 'Student Info', component: StudentInfoStep },
  { id: 'parent', label: 'Parent Info', component: ParentInfoStep },
  { id: 'emergency', label: 'Emergency', component: EmergencyContactsStep },
  { id: 'medical', label: 'Medical', component: MedicalInfoStep },
  { id: 'pickup', label: 'Pick-up Auth', component: PickupAuthorizationStep },
  { id: 'fees', label: 'Fees & Consent', component: FeesAndConsentStep },
  { id: 'terms', label: 'Terms', component: TermsAndConditionsStep },
  { id: 'signature', label: 'Sign', component: null }
];

export default function ParentContract() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    contract_date: new Date().toISOString().split('T')[0],
    status: 'draft'
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [submittedContract, setSubmittedContract] = useState(null);

  // Auto-populate parent email and pre-select school from URL params
  React.useEffect(() => {
    const loadUserEmail = async () => {
      try {
        const user = await auth.me();
        const urlParams = new URLSearchParams(window.location.search);
        const schoolParam = urlParams.get('school');
        const schoolMap = {
          PrePrimary: 'PrePrimary - 74 Krewilkring Meerensee',
          SpecialNeeds: 'Special Needs - 18 Elweboog Meerensee'
        };
        setFormData(prev => ({
          ...prev,
          parent1_email: user?.email || prev.parent1_email,
          ...(schoolParam && schoolMap[schoolParam] ? { school_location: schoolMap[schoolParam] } : {})
        }));
      } catch (error) {
        console.error('Error loading user:', error);
      }
    };
    loadUserEmail();
  }, []);

  const updateFormData = (updates) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const validateStep = () => {
    const step = STEPS[currentStep];
    
    if (step.id === 'student') {
      if (!formData.student_first_name || !formData.student_last_name) {
        toast.error('Please fill in all required student information');
        return false;
      }
    }
    
    if (step.id === 'parent') {
      if (!formData.parent1_full_name || !formData.parent1_email || !formData.parent1_phone || !formData.parent1_address || !formData.parent1_relationship) {
        toast.error('Please fill in all required parent information');
        return false;
      }
    }

    if (step.id === 'emergency') {
      if (!formData.emergency_contact1_name || !formData.emergency_contact1_phone || !formData.emergency_contact1_relationship) {
        toast.error('Please provide at least one emergency contact');
        return false;
      }
    }

    if (step.id === 'medical') {
      if (!formData.consent_medical_treatment) {
        toast.error('Medical treatment consent is required');
        return false;
      }
    }

    if (step.id === 'fees') {
      if (!formData.fee_monthly_amount || !formData.fee_payment_method) {
        toast.error('Please fill in all fee agreement information');
        return false;
      }
    }

    if (step.id === 'terms') {
      if (!formData.agree_code_of_conduct || !formData.agree_terms_conditions) {
        toast.error('You must agree to the terms and conditions to proceed');
        return false;
      }
    }

    if (step.id === 'signature') {
      if (!formData.parent1_signature_data) {
        toast.error('Primary parent/guardian signature is required');
        return false;
      }
    }

    return true;
  };

  const validateAllSteps = () => {
    const missingSteps = [];
    const newErrors = {};
    
    // Student validation
    if (!formData.student_first_name) newErrors.student_first_name = 'Required';
    if (!formData.student_last_name) newErrors.student_last_name = 'Required';
    if (!formData.student_first_name || !formData.student_last_name) {
      missingSteps.push({ step: 0, message: 'Student name is required' });
    }
    
    // Parent validation
    if (!formData.parent1_full_name) newErrors.parent1_full_name = 'Required';
    if (!formData.parent1_email) newErrors.parent1_email = 'Required';
    if (!formData.parent1_phone) newErrors.parent1_phone = 'Required';
    if (!formData.parent1_address) newErrors.parent1_address = 'Required';
    if (!formData.parent1_relationship) newErrors.parent1_relationship = 'Required';
    if (!formData.parent1_full_name || !formData.parent1_email || !formData.parent1_phone || !formData.parent1_address || !formData.parent1_relationship) {
      missingSteps.push({ step: 1, message: 'Complete parent information required' });
    }
    
    // Emergency contact validation
    if (!formData.emergency_contact1_name) newErrors.emergency_contact1_name = 'Required';
    if (!formData.emergency_contact1_phone) newErrors.emergency_contact1_phone = 'Required';
    if (!formData.emergency_contact1_relationship) newErrors.emergency_contact1_relationship = 'Required';
    if (!formData.emergency_contact1_name || !formData.emergency_contact1_phone || !formData.emergency_contact1_relationship) {
      missingSteps.push({ step: 2, message: 'At least one emergency contact required' });
    }
    
    // Medical validation
    if (!formData.consent_medical_treatment) {
      newErrors.consent_medical_treatment = 'Required';
      missingSteps.push({ step: 3, message: 'Medical treatment consent required' });
    }
    
    // Fees validation
    if (!formData.fee_monthly_amount) newErrors.fee_monthly_amount = 'Required';
    if (!formData.fee_payment_method) newErrors.fee_payment_method = 'Required';
    if (!formData.fee_monthly_amount || !formData.fee_payment_method) {
      missingSteps.push({ step: 5, message: 'Fee information required' });
    }
    
    // Terms validation
    if (!formData.agree_code_of_conduct) newErrors.agree_code_of_conduct = 'Required';
    if (!formData.agree_terms_conditions) newErrors.agree_terms_conditions = 'Required';
    if (!formData.agree_code_of_conduct || !formData.agree_terms_conditions) {
      missingSteps.push({ step: 6, message: 'Must agree to terms & conditions' });
    }
    
    // Signature validation
    if (!formData.parent1_signature_data) {
      newErrors.parent1_signature_data = 'Required';
      missingSteps.push({ step: 7, message: 'Signature required' });
    }
    
    setErrors(newErrors);
    return missingSteps;
  };

  const handleNext = () => {
    setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    // Validate all steps before submission
    const missingSteps = validateAllSteps();
    
    if (missingSteps.length > 0) {
      const firstMissing = missingSteps[0];
      setCurrentStep(firstMissing.step);
      toast.error(`Incomplete form: ${firstMissing.message}`, {
        description: `Please complete all required fields in ${STEPS[firstMissing.step].label}`
      });
      
      // Show all missing items
      setTimeout(() => {
        missingSteps.slice(1).forEach((missing, idx) => {
          setTimeout(() => {
            toast.error(missing.message, {
              description: STEPS[missing.step].label
            });
          }, idx * 200);
        });
      }, 500);
      
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await auth.me();
      
      formData.parent1_signature_date = new Date().toISOString();
      if (formData.parent2_signature_data) {
        formData.parent2_signature_date = new Date().toISOString();
      }
      formData.status = 'signed';
      
      // Ensure parent1_email is set to the logged-in user's email
      if (!formData.parent1_email || formData.parent1_email.indexOf('@') === -1) {
        formData.parent1_email = user.email;
      }

      const contract = await db.contracts.create(formData);

      // Auto-generate PDF
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY;
        const pdfRes = await fetch(`${supabaseUrl}/functions/v1/generate-contract-pdf`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': supabaseAnon },
          body: JSON.stringify({ contractId: contract.id })
        });
        const pdfData = await pdfRes.json();
        if (pdfData.success) {
          await db.contracts.update(contract.id, { signed_pdf_url: pdfData.pdfUrl });
          setSubmittedContract({ ...contract, signed_pdf_url: pdfData.pdfUrl });
        }
      } catch (pdfErr) {
        console.error('PDF generation failed:', pdfErr);
        // Don't block the flow - contract was saved
        setSubmittedContract(contract);
      }
      setIsComplete(true);
      // Clear all contract-related cache
      queryClient.removeQueries({ queryKey: ['myContracts'] });
      queryClient.invalidateQueries({ queryKey: ['myContracts'] });
    } catch (error) {
      console.error('Error submitting contract:', error);
      toast.error('Failed to submit contract. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const StepComponent = STEPS[currentStep].component;
  const currentStepId = STEPS[currentStep].id;

  const handleDownload = async () => {
    try {
      if (submittedContract?.signed_pdf_url) {
        window.open(submittedContract.signed_pdf_url, '_blank');
        toast.success('PDF opened in new tab');
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download PDF. Please try again.');
    }
  };

  if (isComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 p-6 flex items-center justify-center">
        <Card className="max-w-2xl w-full p-12 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-4">Thank You!</h1>
          <p className="text-lg text-slate-600 mb-2">
            Your application for <strong>{formData.student_first_name}</strong> has been submitted successfully.
          </p>
          <p className="text-slate-600 mb-8">
            A signed copy has been sent to <strong>{formData.parent1_email}</strong>
          </p>
          <div className="flex items-center justify-center gap-2 text-teal-600 bg-teal-50 p-4 rounded-lg mb-6">
            <FileText className="w-5 h-5" />
            <span className="font-medium">Welcome to Ting-A-Ling Family!</span>
          </div>
          <div className="flex gap-3 justify-center mb-4">
            <Button
              onClick={handleDownload}
              className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 gap-2"
            >
              <FileText className="w-4 h-4" />
              Download Signed Contract
            </Button>
            <Button
              onClick={() => navigate(createPageUrl('MyContracts'))}
              variant="outline"
              className="gap-2"
            >
              View My Contracts
            </Button>
          </div>
          <p className="text-sm text-slate-500">You can now close this page.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <img 
            src="/favicon.png"
            alt="Ting-A-Ling School Logo"
            className="w-32 h-32 mx-auto mb-4 rounded-full"
          />
          <h1 className="text-4xl font-bold text-slate-800 mb-2">Ting-A-Ling School</h1>
          <p className="text-xl text-slate-600">Parent Application Form</p>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {STEPS.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                    index < currentStep 
                      ? 'bg-gradient-to-br from-teal-500 to-cyan-600 text-white' 
                      : index === currentStep
                      ? 'bg-gradient-to-br from-coral-400 to-orange-500 text-white ring-4 ring-orange-200'
                      : 'bg-white text-slate-400 border-2 border-slate-200'
                  }`}>
                    {index < currentStep ? '✓' : index + 1}
                  </div>
                  <span className={`text-xs mt-2 hidden sm:block ${
                    index === currentStep ? 'text-slate-800 font-semibold' : 'text-slate-500'
                  }`}>
                    {step.label}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 rounded-full transition-all ${
                    index < currentStep ? 'bg-gradient-to-r from-teal-500 to-cyan-600' : 'bg-slate-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <Card className="p-8 shadow-xl">
          {currentStepId === 'signature' ? (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Sign the Contract</h2>
                <p className="text-slate-600">Your digital signature confirms your agreement</p>
              </div>

              <div className="space-y-6">
                <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                  <h3 className="font-semibold text-lg text-slate-800 mb-4">Primary Parent/Guardian Signature *</h3>
                  <p className="text-sm text-slate-600 mb-4">
                    <strong>{formData.parent1_full_name}</strong> - {formData.parent1_relationship}
                  </p>
                  <SignaturePad
                    onSignatureChange={(data) => updateFormData({ parent1_signature_data: data })}
                    existingSignature={formData.parent1_signature_data}
                  />
                  {errors.parent1_signature_data && <p className="text-red-600 text-sm mt-2">⚠️ {errors.parent1_signature_data}</p>}
                </div>

                {formData.parent2_full_name && (
                  <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
                    <h3 className="font-semibold text-lg text-slate-800 mb-4">Secondary Parent/Guardian Signature (Optional)</h3>
                    <p className="text-sm text-slate-600 mb-4">
                      <strong>{formData.parent2_full_name}</strong> - {formData.parent2_relationship}
                    </p>
                    <SignaturePad
                      onSignatureChange={(data) => updateFormData({ parent2_signature_data: data })}
                      existingSignature={formData.parent2_signature_data}
                    />
                  </div>
                )}

                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    By signing this contract, you confirm that all information provided is accurate and you agree to all terms and conditions outlined in this agreement.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <StepComponent formData={formData} updateFormData={updateFormData} errors={errors} />
          )}

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0 || isSubmitting}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>

            {currentStep === STEPS.length - 1 ? (
              <Button
                onClick={() => {
                  if (validateStep()) {
                    handleSubmit();
                  }
                }}
                disabled={isSubmitting}
                className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Contract
                    <CheckCircle className="w-4 h-4" />
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                className="bg-white text-black hover:bg-slate-100 gap-2 border-2 border-slate-300"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}