#!/usr/bin/env node
// Conversational templates v2 — warm, human-sounding responses
const initSqlJs = require('/Users/deonvandenberg/.openclaw/workspace/fred/dashboard-api/node_modules/sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'dashboard-api', 'data', 'autoeffortless.db');

const templates = [
  // ── GREETING — warm and short ───────────────────────────────────────────
  {
    name: 'Greeting',
    cat: 'greeting',
    kw: 'hi,hello,hey,howdy,good morning,good afternoon,good day,good evening,yo,howzit',
    content: `Hi there! 👋 Welcome to Ting-A-Ling Schools in Meerensee.

We've got two schools — a Pre-Primary (ages 2–6) and a Special Needs School (ages 3–12). What can I help you with? Fees, hours, enrolment, or something else?`
  },
  // ── GENERAL FALLBACK — when nothing else matches ────────────────────────
  {
    name: 'General Fallback',
    cat: 'general',
    kw: '',
    content: `Sorry, I'm not sure I understood that one. 😅

I can help with fees, hours, enrolment, uniform, and most Ting-A-Ling questions. What are you looking for?`
  },
  // ── FEES ────────────────────────────────────────────────────────────────
  {
    name: 'Fees',
    cat: 'general',
    kw: 'fees,fee,cost,how much,payment,pay,school fees,monthly,registration,price,prices,afford,expensive,cheap,what do i pay',
    content: `Sure, I can help with fees! 😊

Which school are you asking about — **Pre-Primary** or **Special Needs**? The fees are different for each.

I'll give you the exact amounts once I know which one you need.`
  },
  {
    name: 'Fees - Pre-Primary',
    cat: 'general',
    kw: 'pre-primary fees,pre primary fees,pre-primary cost,pre primary cost,creche fees,nursery fees,2 year old fees,3 year old fees',
    content: `Here are the **Pre-Primary fees** per month:

• 07:00 – 13:00 → **R1,900**
• 07:00 – 15:00 → **R2,000**
• 07:00 – 17:00 → **R2,200**

Plus a one-time registration fee of **R1,300**. Fees are due by the 2nd of each month for 11 months (Jan–Nov).

You can pay via EFT, debit order, or cash. Any other questions?`
  },
  {
    name: 'Fees - Special Needs',
    cat: 'general',
    kw: 'special needs fees,special needs cost,special school fees,remedial fees,special needs price',
    content: `Here are the **Special Needs School** fees per month:

• 07:00 – 13:00 → **R3,000**
• 07:00 – 17:00 → **R3,300**

Plus a one-time registration fee of **R1,300**. Fees are due by the 2nd of each month for 11 months (Jan–Nov).

Payment can be made via EFT, debit order, or cash. Let me know if you need anything else!`
  },
  {
    name: 'Fees - General Info',
    cat: 'general',
    kw: 'payment method,eft,debit order,cash,bank transfer,banking,due date,pay by',
    content: `We accept **EFT, debit order, or cash**. Fees are due by the **2nd of each month** and payable for **11 months** (January to November).

The one-time registration fee is **R1,300**.

Do you need the fee breakdown for Pre-Primary or Special Needs?`
  },
  // ── HOURS ───────────────────────────────────────────────────────────────
  {
    name: 'Hours',
    cat: 'general',
    kw: 'hours,time,open,operating,when do you open,when do you close,what time,opening,closing,start,finish',
    content: `Here are our hours:

**Pre-Primary:**
• 07:00 – 13:00 (half-day)
• 07:00 – 15:00 (aftercare)
• 07:00 – 17:00 (aftercare)

**Special Needs:**
• 07:00 – 13:00
• 07:00 – 17:00 (aftercare)

Office hours are 07:00 – 15:30 weekdays. Which school are you interested in?`
  },
  // ── CONTACT ─────────────────────────────────────────────────────────────
  {
    name: 'Contact',
    cat: 'general',
    kw: 'contact,phone,call,email,address,whatsapp,cellphone,telephone,reach,get hold,number,office,speak to',
    content: `You can reach us here:

📧 **Email:** info@tingalingschools.com
📱 **Phone:** 061 527 4429 / 072 456 1282
🌐 **Website:** tingalingschools.com

**📍 Locations:**
• Pre-Primary: 74 Krewilkring, Meerensee
• Special Needs: 18 Elweboog, Meerensee

Office hours: 07:00 – 15:30 weekdays. Feel free to call or pop in!`
  },
  // ── ENROLMENT ───────────────────────────────────────────────────────────
  {
    name: 'Enrolment',
    cat: 'general',
    kw: 'enrol,enrolment,enroll,enrollment,register,registration,admission,sign up,apply,joining,join,how do i enrol',
    content: `Great, you'd like to enrol! 😊

You can either:
• **Online** at tingalingschools.com (parent portal)
• **In person** at the school office

You'll need these documents:
📄 Child's birth certificate
📄 Parent/guardian ID
📄 Latest school report (if applicable)
📄 Clinic card

There's a one-time registration fee of **R1,300**. Which school are you enrolling for?`
  },
  // ── PRE-PRIMARY INFO ────────────────────────────────────────────────────
  {
    name: 'Pre-Primary',
    cat: 'general',
    kw: 'pre-primary,pre primary,preschool,creche,nursery,2 years,3 years,4 years,5 years,6 years,early childhood,play-based,readiness,grade r,grade 00',
    content: `**Pre-Primary School** 🧒

• Ages: **2 to 6 years**
• Play-based learning in English
• Small classes for individual attention
• School readiness programme
• Half-day and aftercare options available

📍 74 Krewilkring, Meerensee

Would you like info on fees or how to enrol?`
  },
  // ── SPECIAL NEEDS INFO ──────────────────────────────────────────────────
  {
    name: 'Special Needs',
    cat: 'general',
    kw: 'special needs,special need,remedial,therapy,learning difficulty,special school,autism,adhd,down syndrome,learning support,development,sensory,occupational,physio,speech',
    content: `**Special Needs School** 🤝

• Ages: **3 to 12 years**
• Individualised care and education
• Therapy support including occupational therapy
• Focus on independence, communication and life skills
• Small class groups
• Aftercare available until 17:00

📍 18 Elweboog, Meerensee

Would you like info on fees or how to enrol?`
  },
  // ── UNIFORM ─────────────────────────────────────────────────────────────
  {
    name: 'Uniform',
    cat: 'general',
    kw: 'uniform,shirt,tracksuit,clothing,dress code,wear,what to wear',
    content: `👔 **Uniform info:**

• Sold during purchase windows announced by the school
• Shirt: **R150**
• Tracksuit: **R450**

Full price list is available from the office. Contact us to find out about the next purchase window.`
  },
  // ── ABSENTEE ────────────────────────────────────────────────────────────
  {
    name: 'Absentee',
    cat: 'general',
    kw: 'absent,absentee,sick,absence,not coming,missing,not at school,ill,illness,doctor,appointment,wont be there,late',
    content: `No problem, please let us know by:

📞 **Calling** the office at 061 527 4429 / 072 456 1282
💬 **WhatsApp us** with:
• Child's **name**
• **Grade** or class
• **Reason** for absence

Office hours: 07:00 – 15:30 weekdays. Hope they feel better soon!`
  },
  // ── EVENTS ──────────────────────────────────────────────────────────────
  {
    name: 'Events',
    cat: 'general',
    kw: 'event,newsletter,parent meeting,sports day,concert,school break,events,communication,friday,weekly,calendar,schedule,upcoming',
    content: `📅 **What's happening:**

• 📱 Parent WhatsApp groups — main communication channel
• 📧 Weekly newsletter every Friday
• 📋 Notice board at the school gate
• 👨‍👩‍👧 Parent-teacher meetings throughout the year
• 🎪 Sports days and concerts announced in advance

Want to know about something specific?`
  },
  // ── AFTERCARE ───────────────────────────────────────────────────────────
  {
    name: 'Aftercare',
    cat: 'general',
    kw: 'aftercare,after care,afterschool,after school,extended day,late pickup,pick up late,stay later,extra time',
    content: `Yes, aftercare is available! 🕐

**Pre-Primary:** Until 15:00 or 17:00
**Special Needs:** Until 17:00

Holiday programmes also run during school breaks. Want more details?`
  },
  // ── FACILITIES ──────────────────────────────────────────────────────────
  {
    name: 'Facilities',
    cat: 'general',
    kw: 'facility,facilities,playground,premises,security,classroom,safe,grounds',
    content: `🏫 **Our facilities:**

• Safe premises with controlled access
• Age-appropriate playgrounds
• Sensory-friendly spaces at the Special Needs School
• Resources for play-based and therapeutic learning

Would you like to arrange a visit?`
  },
  // ── HOLIDAY PROGRAMME ───────────────────────────────────────────────────
  {
    name: 'Holiday Programme',
    cat: 'general',
    kw: 'holiday,holiday programme,school break,vacation,holidays,break',
    content: `🏖️ Yes, holiday programmes run during school breaks!

Contact the office for the latest schedule and pricing.

📞 061 527 4429 / 072 456 1282`
  },
  // ── TOURS ───────────────────────────────────────────────────────────────
  {
    name: 'Tours',
    cat: 'general',
    kw: 'visit,tour,school tour,see the school,look around,before enrolling,come see,view',
    content: `Absolutely, you're welcome to visit! 😊

Just call the office to arrange a tour during school hours.

📞 061 527 4429 / 072 456 1282`
  },
  // ── LOCATION ────────────────────────────────────────────────────────────
  {
    name: 'Location',
    cat: 'general',
    kw: 'location,where are you,address,directions,map,street,near me,meerensee,find you',
    content: `📍 **We're in Meerensee, Richards Bay:**

• **Pre-Primary:** 74 Krewilkring
• **Special Needs:** 18 Elweboog

Both schools are in Meerensee. Which one are you looking for?`
  },
];

async function run() {
  const SQL = await initSqlJs();
  const buf = fs.readFileSync(DB_PATH);
  const db = new SQL.Database(buf);

  // Clear existing templates for client 6
  db.run('DELETE FROM templates WHERE client_id = 6');

  // Insert all templates
  const stmt = db.prepare('INSERT INTO templates (client_id, name, category, trigger_keyword, content, active) VALUES (6, ?, ?, ?, ?, 1)');
  for (const t of templates) {
    stmt.run([t.name, t.cat, t.kw, t.content]);
  }

  // Write back
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));

  const result = db.exec('SELECT COUNT(*) as c FROM templates WHERE client_id = 6');
  console.log(`✅ Inserted ${templates.length} conversational templates for client 6`);
  console.log(`📊 Total templates: ${result[0].values[0][0]}`);

  // Show them
  const names = db.exec('SELECT name, trigger_keyword FROM templates WHERE client_id = 6 ORDER BY name');
  for (const row of names[0].values) {
    console.log(`  • ${row[0]} (triggers: ${(row[1] || 'fallback').substring(0, 40)})`);
  }

  db.close();
}

run().catch(e => { console.error(e); process.exit(1); });
