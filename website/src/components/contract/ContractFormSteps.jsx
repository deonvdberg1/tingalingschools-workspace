import React from 'react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, CheckCircle } from 'lucide-react';

export function StudentInfoStep({ formData, updateFormData, errors = {} }) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Student Information</h2>
        <p className="text-slate-600">Tell us about your child</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="student_first_name">First Name *</Label>
          <Input
            id="student_first_name"
            value={formData.student_first_name || ''}
            onChange={(e) => updateFormData({ student_first_name: e.target.value })}
            className={errors.student_first_name ? 'border-red-500 border-2' : ''}
            required
          />
          {errors.student_first_name && <p className="text-red-600 text-sm mt-1">⚠️ {errors.student_first_name}</p>}
        </div>
        <div>
          <Label htmlFor="student_last_name">Last Name *</Label>
          <Input
            id="student_last_name"
            value={formData.student_last_name || ''}
            onChange={(e) => updateFormData({ student_last_name: e.target.value })}
            className={errors.student_last_name ? 'border-red-500 border-2' : ''}
            required
          />
          {errors.student_last_name && <p className="text-red-600 text-sm mt-1">⚠️ {errors.student_last_name}</p>}
        </div>
      </div>

      <div>
        <Label htmlFor="student_id">Student ID</Label>
        <Input
          id="student_id"
          value={formData.student_id || ''}
          onChange={(e) => updateFormData({ student_id: e.target.value })}
          placeholder="Enter student ID number"
        />
      </div>

      <div>
        <Label htmlFor="student_date_of_birth">Date of Birth *</Label>
        <Input
          id="student_date_of_birth"
          type="date"
          value={formData.student_date_of_birth || ''}
          onChange={(e) => updateFormData({ student_date_of_birth: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="school_location">School Location *</Label>
        <Select
          value={formData.school_location || ''}
          onValueChange={(value) => updateFormData({ school_location: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select location" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PrePrimary - 74 Krewilkring Meerensee">PrePrimary - 74 Krewilkring Meerensee</SelectItem>
            <SelectItem value="Special Needs - 18 Elweboog Meerensee">Special Needs - 18 Elweboog Meerensee</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {formData.school_location?.includes('Special Needs') && (
        <div>
          <Label htmlFor="special_needs_details">Special Needs Details</Label>
          <Textarea
            id="special_needs_details"
            value={formData.special_needs_details || ''}
            onChange={(e) => updateFormData({ special_needs_details: e.target.value })}
            placeholder="Please describe any special needs, accommodations required, etc."
            rows={4}
          />
        </div>
      )}
    </div>
  );
}

export function ParentInfoStep({ formData, updateFormData, errors = {} }) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Parent/Guardian Information</h2>
        <p className="text-slate-600">Primary contact details</p>
      </div>

      <div className="p-6 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl space-y-4">
        <h3 className="font-semibold text-lg text-slate-800 mb-4">Primary Parent/Guardian</h3>
        
        <div>
          <Label htmlFor="parent1_full_name">Full Name *</Label>
          <Input
            id="parent1_full_name"
            value={formData.parent1_full_name || ''}
            onChange={(e) => updateFormData({ parent1_full_name: e.target.value })}
            className={errors.parent1_full_name ? 'border-red-500 border-2' : ''}
            required
          />
          {errors.parent1_full_name && <p className="text-red-600 text-sm mt-1">⚠️ {errors.parent1_full_name}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="parent1_id_number">ID Number</Label>
            <Input
              id="parent1_id_number"
              value={formData.parent1_id_number || ''}
              onChange={(e) => updateFormData({ parent1_id_number: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="parent1_relationship">Relationship *</Label>
            <Input
              id="parent1_relationship"
              value={formData.parent1_relationship || ''}
              onChange={(e) => updateFormData({ parent1_relationship: e.target.value })}
              placeholder="e.g., Mother, Father, Guardian"
              className={errors.parent1_relationship ? 'border-red-500 border-2' : ''}
              required
            />
            {errors.parent1_relationship && <p className="text-red-600 text-sm mt-1">⚠️ {errors.parent1_relationship}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="parent1_email">Email * (Your Login Email)</Label>
            <Input
              id="parent1_email"
              type="email"
              value={formData.parent1_email || ''}
              disabled
              className={`bg-slate-100 cursor-not-allowed ${errors.parent1_email ? 'border-red-500 border-2' : ''}`}
            />
            <p className="text-xs text-slate-500 mt-1">This is your account email and cannot be changed</p>
            {errors.parent1_email && <p className="text-red-600 text-sm mt-1">⚠️ {errors.parent1_email}</p>}
          </div>
          <div>
            <Label htmlFor="parent1_phone">Phone Number *</Label>
            <Input
              id="parent1_phone"
              type="tel"
              value={formData.parent1_phone || ''}
              onChange={(e) => updateFormData({ parent1_phone: e.target.value })}
              className={errors.parent1_phone ? 'border-red-500 border-2' : ''}
              required
            />
            {errors.parent1_phone && <p className="text-red-600 text-sm mt-1">⚠️ {errors.parent1_phone}</p>}
          </div>
        </div>

        <div>
          <Label htmlFor="parent1_address">Physical Address *</Label>
          <Textarea
            id="parent1_address"
            value={formData.parent1_address || ''}
            onChange={(e) => updateFormData({ parent1_address: e.target.value })}
            rows={2}
            className={errors.parent1_address ? 'border-red-500 border-2' : ''}
            required
          />
          {errors.parent1_address && <p className="text-red-600 text-sm mt-1">⚠️ {errors.parent1_address}</p>}
        </div>

        <div>
          <Label htmlFor="parent1_employer">Employer Name</Label>
          <Input
            id="parent1_employer"
            value={formData.parent1_employer || ''}
            onChange={(e) => updateFormData({ parent1_employer: e.target.value })}
            placeholder="Current employer"
          />
        </div>
      </div>

      <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl space-y-4">
        <h3 className="font-semibold text-lg text-slate-800 mb-4">Secondary Parent/Guardian (Optional)</h3>
        
        <div>
          <Label htmlFor="parent2_full_name">Full Name</Label>
          <Input
            id="parent2_full_name"
            value={formData.parent2_full_name || ''}
            onChange={(e) => updateFormData({ parent2_full_name: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="parent2_id_number">ID Number</Label>
            <Input
              id="parent2_id_number"
              value={formData.parent2_id_number || ''}
              onChange={(e) => updateFormData({ parent2_id_number: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="parent2_relationship">Relationship</Label>
            <Input
              id="parent2_relationship"
              value={formData.parent2_relationship || ''}
              onChange={(e) => updateFormData({ parent2_relationship: e.target.value })}
              placeholder="e.g., Mother, Father, Guardian"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="parent2_email">Email</Label>
            <Input
              id="parent2_email"
              type="email"
              value={formData.parent2_email || ''}
              onChange={(e) => updateFormData({ parent2_email: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="parent2_phone">Phone Number</Label>
            <Input
              id="parent2_phone"
              type="tel"
              value={formData.parent2_phone || ''}
              onChange={(e) => updateFormData({ parent2_phone: e.target.value })}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="parent2_employer">Employer Name</Label>
          <Input
            id="parent2_employer"
            value={formData.parent2_employer || ''}
            onChange={(e) => updateFormData({ parent2_employer: e.target.value })}
            placeholder="Current employer"
          />
        </div>
      </div>
    </div>
  );
}

export function EmergencyContactsStep({ formData, updateFormData, errors = {} }) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Emergency Contacts</h2>
        <p className="text-slate-600">People we can contact if parents are unreachable</p>
      </div>

      <div className="p-6 bg-gradient-to-br from-rose-50 to-orange-50 rounded-xl space-y-4">
        <h3 className="font-semibold text-lg text-slate-800">Emergency Contact 1</h3>
        
        <div>
          <Label htmlFor="emergency_contact1_name">Full Name *</Label>
          <Input
            id="emergency_contact1_name"
            value={formData.emergency_contact1_name || ''}
            onChange={(e) => updateFormData({ emergency_contact1_name: e.target.value })}
            className={errors.emergency_contact1_name ? 'border-red-500 border-2' : ''}
            required
          />
          {errors.emergency_contact1_name && <p className="text-red-600 text-sm mt-1">⚠️ {errors.emergency_contact1_name}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="emergency_contact1_phone">Phone Number *</Label>
            <Input
              id="emergency_contact1_phone"
              type="tel"
              value={formData.emergency_contact1_phone || ''}
              onChange={(e) => updateFormData({ emergency_contact1_phone: e.target.value })}
              className={errors.emergency_contact1_phone ? 'border-red-500 border-2' : ''}
              required
            />
            {errors.emergency_contact1_phone && <p className="text-red-600 text-sm mt-1">⚠️ {errors.emergency_contact1_phone}</p>}
          </div>
          <div>
            <Label htmlFor="emergency_contact1_relationship">Relationship *</Label>
            <Input
              id="emergency_contact1_relationship"
              value={formData.emergency_contact1_relationship || ''}
              onChange={(e) => updateFormData({ emergency_contact1_relationship: e.target.value })}
              placeholder="e.g., Grandmother, Uncle"
              className={errors.emergency_contact1_relationship ? 'border-red-500 border-2' : ''}
              required
            />
            {errors.emergency_contact1_relationship && <p className="text-red-600 text-sm mt-1">⚠️ {errors.emergency_contact1_relationship}</p>}
          </div>
        </div>

        <div>
          <Label htmlFor="emergency_contact1_employer">Employer Name</Label>
          <Input
            id="emergency_contact1_employer"
            value={formData.emergency_contact1_employer || ''}
            onChange={(e) => updateFormData({ emergency_contact1_employer: e.target.value })}
            placeholder="Current employer"
          />
        </div>
      </div>

      <div className="p-6 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl space-y-4">
        <h3 className="font-semibold text-lg text-slate-800">Emergency Contact 2</h3>
        
        <div>
          <Label htmlFor="emergency_contact2_name">Full Name</Label>
          <Input
            id="emergency_contact2_name"
            value={formData.emergency_contact2_name || ''}
            onChange={(e) => updateFormData({ emergency_contact2_name: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="emergency_contact2_phone">Phone Number</Label>
            <Input
              id="emergency_contact2_phone"
              type="tel"
              value={formData.emergency_contact2_phone || ''}
              onChange={(e) => updateFormData({ emergency_contact2_phone: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="emergency_contact2_relationship">Relationship</Label>
            <Input
              id="emergency_contact2_relationship"
              value={formData.emergency_contact2_relationship || ''}
              onChange={(e) => updateFormData({ emergency_contact2_relationship: e.target.value })}
              placeholder="e.g., Aunt, Family Friend"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="emergency_contact2_employer">Employer Name</Label>
          <Input
            id="emergency_contact2_employer"
            value={formData.emergency_contact2_employer || ''}
            onChange={(e) => updateFormData({ emergency_contact2_employer: e.target.value })}
            placeholder="Current employer"
          />
        </div>
      </div>
    </div>
  );
}

export function MedicalInfoStep({ formData, updateFormData, errors = {} }) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Medical Information</h2>
        <p className="text-slate-600">Health and medical details</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="medical_aid_provider">Medical Aid Provider</Label>
          <Input
            id="medical_aid_provider"
            value={formData.medical_aid_provider || ''}
            onChange={(e) => updateFormData({ medical_aid_provider: e.target.value })}
            placeholder="e.g., Discovery, Bonitas"
          />
        </div>
        <div>
          <Label htmlFor="medical_aid_number">Medical Aid Number</Label>
          <Input
            id="medical_aid_number"
            value={formData.medical_aid_number || ''}
            onChange={(e) => updateFormData({ medical_aid_number: e.target.value })}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="allergies">Allergies</Label>
        <Textarea
          id="allergies"
          value={formData.allergies || ''}
          onChange={(e) => updateFormData({ allergies: e.target.value })}
          placeholder="Please list any allergies (food, medication, environmental)"
          rows={2}
        />
      </div>

      <div>
        <Label htmlFor="medical_conditions">Medical Conditions</Label>
        <Textarea
          id="medical_conditions"
          value={formData.medical_conditions || ''}
          onChange={(e) => updateFormData({ medical_conditions: e.target.value })}
          placeholder="Please list any medical conditions (asthma, diabetes, epilepsy, etc.)"
          rows={2}
        />
      </div>

      <div>
        <Label htmlFor="medications">Current Medications</Label>
        <Textarea
          id="medications"
          value={formData.medications || ''}
          onChange={(e) => updateFormData({ medications: e.target.value })}
          placeholder="Please list any medications your child takes regularly"
          rows={2}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="doctor_name">Family Doctor Name</Label>
          <Input
            id="doctor_name"
            value={formData.doctor_name || ''}
            onChange={(e) => updateFormData({ doctor_name: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="doctor_phone">Doctor Phone Number</Label>
          <Input
            id="doctor_phone"
            type="tel"
            value={formData.doctor_phone || ''}
            onChange={(e) => updateFormData({ doctor_phone: e.target.value })}
          />
        </div>
      </div>

      <div className={`p-6 bg-gradient-to-br from-red-50 to-pink-50 rounded-xl ${errors.consent_medical_treatment ? 'border-2 border-red-500' : ''}`}>
        <div className="flex items-start space-x-3">
          <Checkbox
            id="consent_medical_treatment"
            checked={formData.consent_medical_treatment || false}
            onCheckedChange={(checked) => updateFormData({ consent_medical_treatment: checked })}
          />
          <div className="flex-1">
            <Label htmlFor="consent_medical_treatment" className="cursor-pointer font-medium">
              Emergency Medical Treatment Consent *
            </Label>
            <p className="text-sm text-slate-600 mt-1">
              I authorize Ting-A-Ling School to seek emergency medical treatment for my child if I cannot be reached. I understand I will be responsible for any medical expenses incurred.
            </p>
            {errors.consent_medical_treatment && <p className="text-red-600 text-sm mt-2">⚠️ {errors.consent_medical_treatment}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

export function PickupAuthorizationStep({ formData, updateFormData }) {
  const authorizedPersons = formData.authorized_pickup_persons || [];

  const addPerson = () => {
    updateFormData({
      authorized_pickup_persons: [
        ...authorizedPersons,
        { name: '', phone: '' }
      ]
    });
  };

  const updatePerson = (index, field, value) => {
    const updated = [...authorizedPersons];
    updated[index] = { ...updated[index], [field]: value };
    updateFormData({ authorized_pickup_persons: updated });
  };

  const removePerson = (index) => {
    updateFormData({
      authorized_pickup_persons: authorizedPersons.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Authorized Pick-up Persons</h2>
        <p className="text-slate-600">Who is allowed to collect your child?</p>
      </div>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Important:</strong> Only persons listed below will be allowed to collect your child. They must present valid ID upon collection.
        </p>
      </div>

      <div className="space-y-4">
        {authorizedPersons.map((person, index) => (
          <div key={index} className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl space-y-4 relative">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-slate-800">Authorized Person {index + 1}</h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removePerson(index)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Full Name *</Label>
                <Input
                  value={person.name || ''}
                  onChange={(e) => updatePerson(index, 'name', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label>Phone Number *</Label>
                <Input
                  type="tel"
                  value={person.phone || ''}
                  onChange={(e) => updatePerson(index, 'phone', e.target.value)}
                  required
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={addPerson}
        className="w-full border-2 border-dashed border-slate-300 hover:border-slate-400 hover:bg-slate-50"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Authorized Person
      </Button>
    </div>
  );
}

export function FeesAndConsentStep({ formData, updateFormData, errors = {} }) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Fees & Consent</h2>
        <p className="text-slate-600">Payment details and permissions</p>
      </div>

      <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl space-y-4">
        <h3 className="font-semibold text-lg text-slate-800 mb-4">Fee Agreement</h3>

        <div>
          <Label htmlFor="fee_monthly_amount">Monthly Fee Amount (R) *</Label>
          <Input
            id="fee_monthly_amount"
            type="number"
            value={formData.fee_monthly_amount || ''}
            onChange={(e) => updateFormData({ fee_monthly_amount: parseFloat(e.target.value) })}
            className={errors.fee_monthly_amount ? 'border-red-500 border-2' : ''}
            required
          />
          <p className="text-sm text-slate-600 mt-2 italic">As per agreement with school</p>
          {errors.fee_monthly_amount && <p className="text-red-600 text-sm mt-1">⚠️ {errors.fee_monthly_amount}</p>}
        </div>

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Payment Schedule:</strong> School fees are due on the 2nd of each month, for 11 months throughout the school year (January - November).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="fee_payment_method">Payment Method *</Label>
            <Select
              value={formData.fee_payment_method || ''}
              onValueChange={(value) => updateFormData({ fee_payment_method: value })}
            >
              <SelectTrigger className={errors.fee_payment_method ? 'border-red-500 border-2' : ''}>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EFT">EFT</SelectItem>
                <SelectItem value="Debit Order">Debit Order</SelectItem>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            {errors.fee_payment_method && <p className="text-red-600 text-sm mt-1">⚠️ {errors.fee_payment_method}</p>}
          </div>
          <div>
            <Label htmlFor="pickup_time">Daily Pickup Time *</Label>
            <Select
              value={formData.pickup_time || ''}
              onValueChange={(value) => updateFormData({ pickup_time: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select pickup time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="13:00">1:00 PM</SelectItem>
                <SelectItem value="13:30">1:30 PM</SelectItem>
                <SelectItem value="15:00">3:00 PM</SelectItem>
                <SelectItem value="17:00">5:00 PM</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-start space-x-3 pt-4">
          <Checkbox
            id="registration_fee_paid"
            checked={formData.registration_fee_paid || false}
            onCheckedChange={(checked) => updateFormData({ registration_fee_paid: checked })}
          />
          <Label htmlFor="registration_fee_paid" className="cursor-pointer">
            Registration fee has been paid
          </Label>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-lg text-slate-800">Consent & Permissions</h3>

        <div className="p-4 bg-white border-2 border-slate-200 rounded-lg flex items-start space-x-3">
          <Checkbox
            id="consent_photos_videos"
            checked={formData.consent_photos_videos || false}
            onCheckedChange={(checked) => updateFormData({ consent_photos_videos: checked })}
          />
          <div className="flex-1">
            <Label htmlFor="consent_photos_videos" className="cursor-pointer font-medium">
              Photo & Video Consent <span className="text-slate-400 font-normal text-sm">(Optional)</span>
            </Label>
            <p className="text-sm text-slate-600 mt-1">
              I give permission for my child to be photographed/videoed for school documentation and internal use.
            </p>
          </div>
        </div>

        <div className="p-4 bg-white border-2 border-slate-200 rounded-lg flex items-start space-x-3">
          <Checkbox
            id="consent_social_media"
            checked={formData.consent_social_media || false}
            onCheckedChange={(checked) => updateFormData({ consent_social_media: checked })}
          />
          <div className="flex-1">
            <Label htmlFor="consent_social_media" className="cursor-pointer font-medium">
              Social Media Consent <span className="text-slate-400 font-normal text-sm">(Optional)</span>
            </Label>
            <p className="text-sm text-slate-600 mt-1">
              I give permission for photos/videos of my child to be shared on the school's social media pages.
            </p>
          </div>
        </div>

        <div className="p-4 bg-white border-2 border-slate-200 rounded-lg flex items-start space-x-3">
          <Checkbox
            id="consent_field_trips"
            checked={formData.consent_field_trips || false}
            onCheckedChange={(checked) => updateFormData({ consent_field_trips: checked })}
          />
          <div className="flex-1">
            <Label htmlFor="consent_field_trips" className="cursor-pointer font-medium">
              Field Trip Consent <span className="text-slate-400 font-normal text-sm">(Optional)</span>
            </Label>
            <p className="text-sm text-slate-600 mt-1">
              I give general consent for my child to participate in school field trips and outings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TermsAndConditionsStep({ formData, updateFormData, errors = {} }) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Terms & Conditions</h2>
        <p className="text-slate-600">Please read and agree to our policies</p>
      </div>

      <div className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl">
        <h3 className="font-bold text-lg text-amber-900 mb-3 flex items-center gap-2">
          <span className="text-2xl">⚠️</span>
          Important Fee Payment Terms
        </h3>
        <ul className="space-y-2 text-amber-900">
          <li className="flex items-start gap-2">
            <span className="text-amber-600 font-bold">•</span>
            <span><strong>School fees are due on the 2nd of each month, for 11 months throughout the school year (January - November).</strong></span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-600 font-bold">•</span>
            <span><strong>5% interest monthly will be charged on overdue school fees.</strong></span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-600 font-bold">•</span>
            <span><strong>Legal charges will be billed to parents for collection of overdue fees.</strong></span>
          </li>
        </ul>
      </div>

      <div className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-300 rounded-xl">
        <h3 className="font-bold text-lg text-blue-900 mb-3 flex items-center gap-2">
          <span className="text-2xl">📄</span>
          Required Documents
        </h3>
        <p className="text-blue-900">
          <strong>Copies of all documents need to be handed in or updated with the school's admin team:</strong> Parent ID, Birth Certificate, Clinic Cards, and Proof of Residence.
        </p>
      </div>

      <div className="max-h-96 overflow-y-auto p-6 bg-slate-50 rounded-xl border border-slate-200">
        <div className="prose prose-sm text-slate-700 space-y-4">
          <h3 className="font-bold text-lg">Code of Conduct</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>Parents must ensure their child arrives on time and is collected on time.</li>
            <li>Children must be dressed appropriately for school activities.</li>
            <li>Parents must notify the school of any changes to contact information.</li>
            <li>Respectful communication with staff and other parents is required at all times.</li>
            <li>The school has zero tolerance for bullying, violence, or discrimination.</li>
          </ul>

          <h3 className="font-bold text-lg mt-6">Fee Policy</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>School fees are due on the 2nd of each month, for 11 months throughout the school year (January - November).</strong></li>
            <li><strong>5% interest monthly will be charged on overdue school fees.</strong></li>
            <li><strong>Legal charges will be billed to parents for collection of overdue fees.</strong></li>
            <li><strong>School fees will be revised annually.</strong></li>
            <li>Non-payment may result in the child being unable to attend school.</li>
            <li>Registration fees are non-refundable.</li>
            <li>One month's written notice is required for withdrawal.</li>
          </ul>

          <h3 className="font-bold text-lg mt-6">Illness & Medication</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>Children who are unwell must stay at home.</li>
            <li>Parents will be contacted if a child becomes ill during school hours.</li>
            <li>Parents must provide written consent for any medication to be administered.</li>
            <li>The school will follow all prescribed medication instructions.</li>
          </ul>

          <h3 className="font-bold text-lg mt-6">Discipline Policy</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>The school uses positive reinforcement and age-appropriate discipline.</li>
            <li>Serious behavioral issues will be discussed with parents.</li>
            <li>The school reserves the right to dismiss a child for serious misconduct.</li>
          </ul>

          <h3 className="font-bold text-lg mt-6">Liability</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>The school takes all reasonable precautions for child safety.</li>
            <li>The school is not liable for loss or damage to personal belongings.</li>
            <li>Parents are responsible for ensuring their child is collected by authorized persons only.</li>
          </ul>

          <h3 className="font-bold text-lg mt-6">Confidentiality</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>All personal information is kept confidential and secure.</li>
            <li>Information may be shared with relevant authorities if required by law.</li>
          </ul>
        </div>
      </div>

      <div className="space-y-4">
        <div className={`p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 ${errors.agree_code_of_conduct ? 'border-red-500' : 'border-blue-200'} rounded-lg flex items-start space-x-3`}>
          <Checkbox
            id="agree_code_of_conduct"
            checked={formData.agree_code_of_conduct || false}
            onCheckedChange={(checked) => updateFormData({ agree_code_of_conduct: checked })}
            required
          />
          <div className="flex-1">
            <Label htmlFor="agree_code_of_conduct" className="cursor-pointer font-medium">
              I agree to the School Code of Conduct *
            </Label>
            <p className="text-sm text-slate-600 mt-1">
              I have read and agree to comply with all school policies and code of conduct.
            </p>
            {errors.agree_code_of_conduct && <p className="text-red-600 text-sm mt-2">⚠️ {errors.agree_code_of_conduct}</p>}
          </div>
        </div>

        <div className={`p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-2 ${errors.agree_terms_conditions ? 'border-red-500' : 'border-purple-200'} rounded-lg flex items-start space-x-3`}>
          <Checkbox
            id="agree_terms_conditions"
            checked={formData.agree_terms_conditions || false}
            onCheckedChange={(checked) => updateFormData({ agree_terms_conditions: checked })}
            required
          />
          <div className="flex-1">
            <Label htmlFor="agree_terms_conditions" className="cursor-pointer font-medium">
              I agree to the Terms & Conditions *
            </Label>
            <p className="text-sm text-slate-600 mt-1">
              I have read and agree to all the terms, conditions, and policies outlined above.
            </p>
            {errors.agree_terms_conditions && <p className="text-red-600 text-sm mt-2">⚠️ {errors.agree_terms_conditions}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}