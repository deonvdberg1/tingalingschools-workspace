-- Ting-A-Ling Schools Template Seeds
-- Converted from KB content for non-admin WhatsApp auto-replies
-- Client ID: 6

-- 1. General greeting (used when no keyword matches)
INSERT INTO templates (client_id, name, category, trigger_keyword, content, active)
VALUES (6, 'General Greeting', 'general', '',
'👋 Welcome to Ting-A-Ling Schools!

We have two schools in Meerensee, Richards Bay:
• 🧒 **Pre-Primary** (ages 2–6)
• 🤝 **Special Needs** (ages 3–12)

Which school are you interested in? I can help with fees, hours, enrolment, or any other question you have.

Or visit: tingalingschools.com');

-- 2. School Fees
INSERT INTO templates (client_id, name, category, trigger_keyword, content, active)
VALUES (6, 'School Fees', 'general', 'fees,fee,cost,how much,payment,pay,school fees,monthly fee,registration fee,price,prices,afford',
'💰 **School Fees (per month):**

**Pre-Primary:**
• 07:00–13:00: R1,900
• 07:00–15:00: R2,000
• 07:00–17:00: R2,200

**Special Needs:**
• 07:00–13:00: R3,000
• 07:00–17:00: R3,300

📌 Fees due by the 2nd of each month | Payable Jan–Nov (11 months)
📌 One-time registration fee: R1,300
💳 Payment: EFT, Debit Order, or Cash

Which school are you interested in?');

-- 3. Operating Hours
INSERT INTO templates (client_id, name, category, trigger_keyword, content, active)
VALUES (6, 'Operating Hours', 'general', 'hours,time,open,operating hours,operating,when do you open,when do you close,what time,opening,closing',
'🕐 **Operating Hours:**

**Pre-Primary:**
• 07:00 – 13:00
• 07:00 – 15:00 (aftercare)
• 07:00 – 17:00 (aftercare)

**Special Needs:**
• 07:00 – 13:00
• 07:00 – 17:00 (aftercare)

🏖️ Holiday programmes available during school breaks.

Office hours: 07:00 – 15:30 weekdays');

-- 4. Contact Information
INSERT INTO templates (client_id, name, category, trigger_keyword, content, active)
VALUES (6, 'Contact Information', 'general', 'contact,phone,call,email,address,whatsapp,cellphone,telephone,reach,get hold,number,office',
'📞 **Contact Us:**

• 📧 Email: info@tingalingschools.com
• 📱 Phone: 0615274429 / 0724561282
• 🌐 Website: tingalingschools.com

**📍 Locations:**
• Pre-Primary: 74 Krewilkring, Meerensee
• Special Needs: 18 Elweboog, Meerensee

Office hours: 07:00 – 15:30 weekdays');

-- 5. Enrolment
INSERT INTO templates (client_id, name, category, trigger_keyword, content, active)
VALUES (6, 'Enrolment', 'general', 'enrol,enrolment,enroll,enrollment,register,registration,admission,sign up,apply,joining,join',
'📝 **Enrolment Process:**

• **Online:** Through the parent portal on tingalingschools.com
• **In-person:** Visit the school office for a registration pack
• Open for both Pre-Primary and Special Needs

**Required documents:**
📄 Child''s birth certificate
📄 Parent/guardian ID
📄 Latest school report (if applicable)
📄 Clinic card

One-time registration fee of R1,300 applies.

Which school are you interested in?');

-- 6. Pre-Primary School Info
INSERT INTO templates (client_id, name, category, trigger_keyword, content, active)
VALUES (6, 'Pre-Primary Info', 'general', 'pre-primary,pre primary,preschool,creche,nursery,2 years,3 years,4 years,5 years,6 years,early childhood,play-based,readiness,pre school',
'🧒 **Pre-Primary School**

• Ages: 2 to 6 years
• Approach: Play-based learning in English
• Small class sizes for individual attention
• School readiness programme for primary transition
• Half-day options available
• Aftercare available until 17:00

📍 74 Krewilkring, Meerensee, Richards Bay

Would you like info on fees or enrolment?');

-- 7. Special Needs School Info
INSERT INTO templates (client_id, name, category, trigger_keyword, content, active)
VALUES (6, 'Special Needs Info', 'general', 'special needs,special need,remedial,therapy,learning difficulty,special school,autism,adhd,down syndrome,learning,development,sensory,occupational',
'🤝 **Special Needs School**

• Ages: 3 to 12 years
• Individualised care and education
• Dedicated team of specialists
• Therapy support available (including occupational therapy)
• Focus on independence, communication, and life skills
• Small, focused class groups
• Close collaboration with parents
• Aftercare available until 17:00

📍 18 Elweboog, Meerensee, Richards Bay

Would you like info on fees or enrolment?');

-- 8. Uniform
INSERT INTO templates (client_id, name, category, trigger_keyword, content, active)
VALUES (6, 'Uniform', 'general', 'uniform,shirt,tracksuit,clothing,dress code,wear,uniforms',
'👔 **Uniform Information:**

• Uniforms available during purchase windows announced by the school
• Full price list available from the office
• Standardised colours and styles

**Prices:**
• Shirt: R150
• Tracksuit: R450

Contact the office for the next purchase window.');

-- 9. Absentee Reporting
INSERT INTO templates (client_id, name, category, trigger_keyword, content, active)
VALUES (6, 'Absentee Reporting', 'general', 'absent,absentee,sick,absence,not coming,missing,not at school,won''t be there,ill,illness,doctor,appointment',
'📋 **Reporting an Absence:**

Please contact the school office during hours (07:00–15:30 weekdays) or WhatsApp us with:
• Child''s **NAME**
• **GRADE** or class
• **REASON** for absence

📞 Phone: 0615274429 / 0724561282');

-- 10. Events & Communication
INSERT INTO templates (client_id, name, category, trigger_keyword, content, active)
VALUES (6, 'Events & Communication', 'general', 'event,newsletter,parent meeting,sports day,concert,school break,events,communication,friday,weekly,schedule,calendar',
'📅 **Events & Communication:**

• 📱 Parent WhatsApp groups – main communication channel
• 📧 Weekly newsletter every Friday
• 📋 Notice board at the school gate
• 👨‍👩‍👧 Parent-teacher meetings throughout the year
• 🎪 Sports days, concerts and special events announced in advance
• 🚨 Emergency closures via WhatsApp and notice board');

-- 11. Aftercare
INSERT INTO templates (client_id, name, category, trigger_keyword, content, active)
VALUES (6, 'Aftercare', 'general', 'aftercare,after care,afterschool,after school,extended day,late pickup,pick up late,stay later',
'🕐 **Aftercare Options:**

**Pre-Primary:**
• Until 15:00 or 17:00

**Special Needs:**
• Until 17:00

Holiday programmes also available during school breaks.');

-- 12. Facilities
INSERT INTO templates (client_id, name, category, trigger_keyword, content, active)
VALUES (6, 'Facilities', 'general', 'facility,facilities,playground,premises,security,classroom,safe,grounds',
'🏫 **School Facilities:**

• Safe, secure premises with controlled access
• Age-appropriate playgrounds and learning spaces
• Sensory-friendly environments at the Special Needs School
• Classroom resources for play-based and therapeutic learning');

-- 13. Holiday Programme
INSERT INTO templates (client_id, name, category, trigger_keyword, content, active)
VALUES (6, 'Holiday Programme', 'general', 'holiday,holiday programme,school break,vacation,holidays,break',
'🏖️ **Holiday Programmes:**

Yes, holiday programmes run during school breaks. Contact the office for the latest schedule and pricing.

📞 0615274429 / 0724561282');

-- 14. FAQ - Tours
INSERT INTO templates (client_id, name, category, trigger_keyword, content, active)
VALUES (6, 'FAQ - Tours', 'general', 'visit,tour,school tour,see the school,look around,before enrolling',
'✅ Yes, you can visit the school before enrolling! Contact the office to arrange a tour during school hours.

📞 0615274429 / 0724561282');

-- 15. FAQ - Half Day
INSERT INTO templates (client_id, name, category, trigger_keyword, content, active)
VALUES (6, 'FAQ - Half Day', 'general', 'half day,half-day,part time,part-time,mornings only',
'✅ Yes, half-day options are available at the Pre-Primary School (07:00–13:00).');

-- 16. FAQ - Therapy
INSERT INTO templates (client_id, name, category, trigger_keyword, content, active)
VALUES (6, 'FAQ - Therapy', 'general', 'therapy,occupational,physio,speech,therapist',
'✅ The Special Needs School offers therapy support including occupational therapy. Contact the office for details specific to your child''s needs.

📞 0615274429 / 0724561282');

-- 17. FAQ - Payment Methods
INSERT INTO templates (client_id, name, category, trigger_keyword, content, active)
VALUES (6, 'FAQ - Payment Methods', 'general', 'eft,debit order,cash,bank transfer,banking details,pay,payment method',
'💳 **Payment Methods Accepted:**
• EFT (Electronic Funds Transfer)
• Debit Order
• Cash

Fees are due by the 2nd of each month, payable for 11 months (January to November).');
