import type { Audit, DemoCase, Flag } from "./types";

export type Lang = "en" | "hi" | "kn";

export const LANG_LABEL: Record<Lang, string> = {
  en: "English",
  hi: "हिन्दी",
  kn: "ಕನ್ನಡ",
};

const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

type Strings = {
  to: string;
  through: string;
  subject: (claimNo: string, amount: string) => string;
  policyNo: string;
  insured: string;
  hospital: string;
  admission: string;
  discharge: string;
  billed: string;
  admitted: string;
  disputed: string;
  salutation: string;
  opening: (patient: string, policyNo: string, hospital: string) => string;
  groundsIntro: string;
  ruleWord: string;
  hospitalSection: string;
  prayer: (amount: string) => string;
  escalation: string;
  signoff: string;
  enclosed: string;
  reasonByKind: Record<string, string>;
  titleByKind: Record<string, string>;
};

const EN: Strings = {
  to: "The Grievance Redressal Officer",
  through: "Through:",
  subject: (c, a) => `Claim ${c} — request to reverse ${a} of deductions made without basis in the policy`,
  policyNo: "Policy No.",
  insured: "Insured",
  hospital: "Hospital",
  admission: "Admission",
  discharge: "Discharge",
  billed: "Total billed",
  admitted: "Admitted by TPA",
  disputed: "Amount in dispute",
  salutation: "Madam / Sir,",
  opening: (patient, policyNo, hospital) =>
    `I am the insured under policy ${policyNo}. I write regarding the hospitalisation at ${hospital}, and the deductions your office has made from my claim. I have had the bill audited line by line against my policy schedule and against the regulations issued by IRDAI.`,
  groundsIntro: "The following deductions have no lawful basis:",
  ruleWord: "Rule",
  hospitalSection:
    "Separately, the hospital has billed me items that IRDAI's itemisation lists already place inside charges I have paid — registration and administrative costs under List-IV, consumables such as gloves under List-I. I ask you to direct the hospital to reverse these.",
  prayer: (a) =>
    `I therefore request you to reverse the deductions set out above and settle ${a} within fourteen days.`,
  escalation:
    "Regulation 17 of the IRDAI (Protection of Policyholders' Interests) Regulations, 2017 requires a grievance to be resolved within fourteen days. If I do not receive a reasoned reply within that period, I will place this on the IRDAI Bima Bharosa portal and before the Insurance Ombudsman. Nothing in this letter waives any of my rights.",
  signoff: "Yours faithfully,",
  enclosed: "Enclosed: itemised bill, discharge summary, policy schedule, remittance advice.",
  reasonByKind: {
    illegal_proportionate:
      "The room-rent ratio applies to room, surgeon and OT charges only. It cannot be applied to a fixed-cost line.",
    phantom_clause: "No clause in my policy supports this deduction.",
    icu_exception: "Beyond three days in ICU, the air-bed charge is admissible under the schedule.",
    whole_implant: "An implant is prosthesis, not a consumable, and cannot be disallowed in full.",
    list_i_billed: "This item is on IRDAI List-I and may not be charged to the patient.",
    arithmetic: "The amount charged does not multiply out from quantity and rate.",
  },
  titleByKind: {
    illegal_proportionate: "Illegal proportionate cut",
    phantom_clause: "Deduction with no clause in the policy",
    icu_exception: "ICU exception ignored",
    whole_implant: "Whole implant disallowed",
    list_i_billed: "Non-payable item billed",
    arithmetic: "Arithmetic mismatch",
  },
};

const HI: Strings = {
  to: "शिकायत निवारण अधिकारी",
  through: "माध्यम:",
  subject: (c, a) => `क्लेम संख्या ${c} — पॉलिसी में आधार रहित ${a} की कटौती रद्द करने का अनुरोध`,
  policyNo: "पॉलिसी संख्या",
  insured: "बीमाधारक",
  hospital: "अस्पताल",
  admission: "भर्ती",
  discharge: "छुट्टी",
  billed: "कुल बिल",
  admitted: "TPA द्वारा स्वीकृत",
  disputed: "विवादित राशि",
  salutation: "महोदय / महोदया,",
  opening: (patient, policyNo, hospital) =>
    `मैं पॉलिसी संख्या ${policyNo} के अंतर्गत बीमाधारक हूँ। यह पत्र ${hospital} में हुए भर्ती और मेरे क्लेम से की गई कटौतियों के संबंध में है। मैंने अपने बिल की हर पंक्ति की जाँच अपनी पॉलिसी और IRDAI के नियमों के अनुसार कराई है।`,
  groundsIntro: "निम्नलिखित कटौतियों का कोई वैध आधार नहीं है:",
  ruleWord: "नियम",
  hospitalSection:
    "इसके अतिरिक्त, अस्पताल ने मुझसे ऐसी मदें वसूली हैं जो IRDAI की मद-वार सूची (सर्कुलर 176/09/2019) के अनुसार पहले से लिए गए शुल्कों में शामिल हैं — पंजीकरण एवं प्रशासनिक शुल्क सूची-IV में, तथा दस्ताने जैसी सामग्री सूची-I में। कृपया अस्पताल को ये राशि वापस करने का निर्देश दें।",
  prayer: (a) => `अतः अनुरोध है कि उपरोक्त कटौतियाँ रद्द कर ${a} की राशि चौदह दिनों के भीतर अदा की जाए।`,
  escalation:
    "IRDAI (बीमाधारक हित संरक्षण) विनियम, 2017 के विनियम 17 के अनुसार शिकायत का निपटारा चौदह दिनों में होना चाहिए। यदि इस अवधि में कारण सहित उत्तर नहीं मिला, तो मैं IRDAI बीमा भरोसा पोर्टल और बीमा लोकपाल के समक्ष शिकायत दर्ज करूँगा। इस पत्र से मेरे किसी अधिकार का त्याग नहीं होता।",
  signoff: "भवदीय,",
  enclosed: "संलग्न: विस्तृत बिल, डिस्चार्ज सारांश, पॉलिसी, भुगतान विवरण।",
  reasonByKind: {
    illegal_proportionate:
      "कमरे के किराए का अनुपात केवल कमरे, सर्जन और ऑपरेशन थिएटर शुल्क पर लागू होता है — दवाओं या इम्प्लांट पर नहीं।",
    phantom_clause: "इस कटौती के लिए पॉलिसी में कोई उल्लेख नहीं है।",
    icu_exception: "ICU में तीन दिन से अधिक रहने पर एयर बेड शुल्क देय है।",
    whole_implant: "इम्प्लांट कंज्यूमेबल नहीं है; इसे पूरी तरह अस्वीकार नहीं किया जा सकता।",
    list_i_billed: "यह मद IRDAI सूची-I में है और रोगी से अलग से नहीं ली जा सकती।",
    arithmetic: "वसूली गई राशि मात्रा और दर के गुणनफल से मेल नहीं खाती।",
  },
  titleByKind: {
    illegal_proportionate: "अवैध आनुपातिक कटौती",
    phantom_clause: "पॉलिसी में उल्लेख न होने पर भी कटौती",
    icu_exception: "ICU अपवाद की अनदेखी",
    whole_implant: "पूरा इम्प्लांट अस्वीकृत",
    list_i_billed: "अदेय मद रोगी से वसूली",
    arithmetic: "गणना में असंगति",
  },
};

const KN: Strings = {
  to: "ಗ್ರಾಹಕ ದೂರು ನಿವಾರಣಾ ಅಧಿಕಾರಿಗೆ",
  through: "ಮೂಲಕ:",
  subject: (c, a) => `ಕ್ಲೇಮ್ ಸಂಖ್ಯೆ ${c} — ಪಾಲಿಸಿಯಲ್ಲಿ ಆಧಾರವಿಲ್ಲದ ${a} ಕಡಿತವನ್ನು ರದ್ದುಗೊಳಿಸುವ ಬಗ್ಗೆ`,
  policyNo: "ಪಾಲಿಸಿ ಸಂಖ್ಯೆ",
  insured: "ವಿಮೆದಾರ",
  hospital: "ಆಸ್ಪತ್ರೆ",
  admission: "ದಾಖಲಾತಿ",
  discharge: "ಡಿಸ್ಚಾರ್ಜ್",
  billed: "ಒಟ್ಟು ಬಿಲ್",
  admitted: "TPA ಅನುಮೋದಿಸಿದ ಮೊತ್ತ",
  disputed: "ವಿವಾದಿತ ಮೊತ್ತ",
  salutation: "ಮಾನ್ಯರೇ,",
  opening: (patient, policyNo, hospital) =>
    `ನಾನು ಪಾಲಿಸಿ ಸಂಖ್ಯೆ ${policyNo} ರ ವಿಮೆದಾರ. ${hospital} ನಲ್ಲಿ ನಡೆದ ಚಿಕಿತ್ಸೆ ಮತ್ತು ನನ್ನ ಕ್ಲೇಮ್ನಲ್ಲಿ ಮಾಡಿರುವ ಕಡಿತಗಳ ಕುರಿತು ಈ ಪತ್ರ ಬರೆಯುತ್ತಿದ್ದೇನೆ. ನನ್ನ ಬಿಲ್ನ ಪ್ರತಿಯೊಂದು ಸಾಲನ್ನು ಪಾಲಿಸಿ ಹಾಗೂ IRDAI ನಿಯಮಗಳ ಆಧಾರದಲ್ಲಿ ಪರಿಶೀಲಿಸಿದ್ದೇನೆ.`,
  groundsIntro: "ಕೆಳಗಿನ ಕಡಿತಗಳಿಗೆ ಯಾವುದೇ ಕಾನೂನುಬದ್ಧ ಆಧಾರವಿಲ್ಲ:",
  ruleWord: "ನಿಯಮ",
  hospitalSection:
    "ಜೊತೆಗೆ, IRDAI ನ ಮದ-ವಾರು ಪಟ್ಟಿ (ಸರ್ಕ್ಯುಲರ್ 176/09/2019) ಪ್ರಕಾರ ಈಗಾಗಲೇ ವಸೂಲಿ ಮಾಡಿದ ಶುಲ್ಕಗಳಲ್ಲಿ ಸೇರಿರುವ ವಸ್ತುಗಳನ್ನು ಆಸ್ಪತ್ರೆ ನನ್ನಿಂದ ಪ್ರತ್ಯೇಕವಾಗಿ ವಸೂಲಿ ಮಾಡಿದೆ — ನೋಂದಣಿ ಮತ್ತು ಆಡಳಿತ ಶುಲ್ಕಗಳು ಪಟ್ಟಿ-IV ನಲ್ಲಿ, ಕೈಗವಸು ಮುಂತಾದವು ಪಟ್ಟಿ-I ನಲ್ಲಿ. ಆ ಮೊತ್ತವನ್ನು ಹಿಂತಿರುಗಿಸುವಂತೆ ಆಸ್ಪತ್ರೆಗೆ ಸೂಚಿಸಬೇಕಾಗಿ ಕೋರುತ್ತೇನೆ.",
  prayer: (a) => `ಆದ್ದರಿಂದ, ಮೇಲಿನ ಕಡಿತಗಳನ್ನು ರದ್ದುಗೊಳಿಸಿ ${a} ಮೊತ್ತವನ್ನು ಹದಿನಾಲ್ಕು ದಿನಗಳೊಳಗೆ ಪಾವತಿಸಬೇಕಾಗಿ ಕೋರುತ್ತೇನೆ.`,
  escalation:
    "IRDAI (ವಿಮೆದಾರರ ಹಿತ ರಕ್ಷಣೆ) ನಿಯಮಾವಳಿ, 2017 ರ ನಿಯಮ 17 ರಂತೆ ದೂರನ್ನು ಹದಿನಾಲ್ಕು ದಿನಗಳೊಳಗೆ ಇತ್ಯರ್ಥಪಡಿಸಬೇಕು. ಈ ಅವಧಿಯಲ್ಲಿ ಕಾರಣಸಹಿತ ಉತ್ತರ ಬಾರದಿದ್ದಲ್ಲಿ, IRDAI ಬೀಮಾ ಭರೋಸಾ ಪೋರ್ಟಲ್ ಹಾಗೂ ವಿಮಾ ಲೋಕಪಾಲರ ಮುಂದೆ ದೂರು ಸಲ್ಲಿಸುತ್ತೇನೆ. ಈ ಪತ್ರದಿಂದ ನನ್ನ ಯಾವುದೇ ಹಕ್ಕು ಬಿಟ್ಟುಕೊಡುವುದಿಲ್ಲ.",
  signoff: "ನಿಮ್ಮ ವಿಶ್ವಾಸಿ,",
  enclosed: "ಲಗತ್ತು: ವಿವರವಾದ ಬಿಲ್, ಡಿಸ್ಚಾರ್ಜ್ ಸಾರಾಂಶ, ಪಾಲಿಸಿ, ಪಾವತಿ ವಿವರ.",
  reasonByKind: {
    illegal_proportionate:
      "ಕೊಠಡಿ ಬಾಡಿಗೆ ಅನುಪಾತವು ಕೇವಲ ಕೊಠಡಿ, ಶಸ್ತ್ರಚಿಕಿತ್ಸಕರು ಮತ್ತು ಆಪರೇಷನ್ ಥಿಯೇಟರ್ ಶುಲ್ಕಗಳಿಗೆ ಅನ್ವಯಿಸುತ್ತದೆ — ಔಷಧಿ ಅಥವಾ ಇಂಪ್ಲಾಂಟ್ಗಳಿಗಲ್ಲ.",
    phantom_clause: "ಈ ಕಡಿತಕ್ಕೆ ಪಾಲಿಸಿಯಲ್ಲಿ ಯಾವುದೇ ಆಧಾರವಿಲ್ಲ.",
    icu_exception: "ICU ನಲ್ಲಿ ಮೂರು ದಿನಗಳಿಗಿಂತ ಹೆಚ್ಚು ಇದ್ದಾಗ ಏರ್ ಬೆಡ್ ಶುಲ್ಕ ಪಾವತಿಸಬೇಕು.",
    whole_implant: "ಇಂಪ್ಲಾಂಟ್ ಕನ್ಸ್ಯೂಮಬಲ್ ಅಲ್ಲ; ಅದನ್ನು ಸಂಪೂರ್ಣವಾಗಿ ತಿರಸ್ಕರಿಸಲಾಗದು.",
    list_i_billed: "ಈ ವಸ್ತು IRDAI ಪಟ್ಟಿ-I ನಲ್ಲಿದೆ ಮತ್ತು ರೋಗಿಯಿಂದ ಪ್ರತ್ಯೇಕವಾಗಿ ವಸೂಲಿ ಮಾಡಬಾರದು.",
    arithmetic: "ವಸೂಲಿ ಮಾಡಿದ ಮೊತ್ತವು ಪ್ರಮಾಣ ಮತ್ತು ದರದ ಗುಣಲಬ್ಧಕ್ಕೆ ಹೊಂದಿಕೆಯಾಗುತ್ತಿಲ್ಲ.",
  },
  titleByKind: {
    illegal_proportionate: "ಅಕ್ರಮ ಅನುಪಾತ ಕಡಿತ",
    phantom_clause: "ಪಾಲಿಸಿಯಲ್ಲಿ ಇಲ್ಲದ ಆಧಾರದ ಮೇಲೆ ಕಡಿತ",
    icu_exception: "ICU ವಿನಾಯಿತಿ ನಿರ್ಲಕ್ಷ್ಯ",
    whole_implant: "ಇಡೀ ಇಂಪ್ಲಾಂಟ್ ತಿರಸ್ಕೃತ",
    list_i_billed: "ಪಾವತಿಸಲಾಗದ ವಸ್ತು ರೋಗಿಯಿಂದ ವಸೂಲಿ",
    arithmetic: "ಲೆಕ್ಕಾಚಾರದ ಅಸಂಗತಿ",
  },
};

const STRINGS: Record<Lang, Strings> = { en: EN, hi: HI, kn: KN };

export type Letter = {
  lang: Lang;
  dateLabel: string;
  to: string;
  subject: string;
  text: string;
  whatsapp: string;
  demand: number;
};

export function buildLetter(
  c: DemoCase,
  a: Audit,
  lang: Lang,
  dateLabel: string,
  siteUrl: string,
): Letter {
  const s = STRINGS[lang];
  const tpaFlags = a.flags.filter((f) => f.against === "tpa");
  const hospitalFlags = a.flags.filter((f) => f.against === "hospital");
  const demand = tpaFlags.reduce((sum, f) => sum + f.amount, 0);
  const hospitalTotal = hospitalFlags.reduce((sum, f) => sum + f.amount, 0);

  const tpaAdmitted = a.lines.reduce((sum, l) => sum + l.tpaAllowed, 0);

  const lines: string[] = [];
  lines.push(s.to);
  lines.push(c.policy.insurer);
  lines.push(`${s.through} ${c.policy.tpa}`);
  lines.push("");
  lines.push(`Date: ${dateLabel}`);
  lines.push("");
  lines.push(`${s.subject(c.policy.claimNo, inr(demand))}`);
  lines.push("");
  lines.push(`${s.policyNo} ${c.policy.policyNo}`);
  lines.push(`${s.insured} ${c.patientName}, ${c.patientAge}`);
  lines.push(`${s.hospital} ${c.hospital}, ${c.city}`);
  lines.push(`${s.admission} ${c.admission}   ${s.discharge} ${c.discharge}`);
  lines.push("");
  lines.push(`${s.billed} ${inr(a.billed)}`);
  lines.push(`${s.admitted} ${inr(tpaAdmitted)}`);
  lines.push(`${s.disputed} ${inr(demand)}`);
  lines.push("");
  lines.push(s.salutation);
  lines.push("");
  lines.push(s.opening(c.patientName, c.policy.policyNo, c.hospital));
  lines.push("");
  lines.push(s.groundsIntro);
  lines.push("");

  tpaFlags.forEach((f, i) => {
    const itemLabel = c.items.find((x) => x.id === f.itemId)?.label ?? "";
    lines.push(`${i + 1}. ${s.titleByKind[f.kind] ?? f.title} — ${inr(f.amount)}`);
    if (itemLabel) lines.push(`   ${itemLabel}`);
    lines.push(`   ${s.reasonByKind[f.kind] ?? ""}`);
    lines.push(`   ${s.ruleWord}: ${f.citation}`);
    lines.push("");
  });

  if (hospitalFlags.length) {
    lines.push(s.hospitalSection);
    lines.push("");
    hospitalFlags.forEach((f, i) => {
      lines.push(`   ${i + 1}. ${s.titleByKind[f.kind] ?? f.title} — ${inr(f.amount)}`);
      lines.push(`      ${s.ruleWord}: ${f.citation}`);
    });
    lines.push("");
  }

  lines.push(s.prayer(inr(demand + hospitalTotal)));
  lines.push("");
  lines.push(s.escalation);
  lines.push("");
  lines.push(s.signoff);
  lines.push(c.patientName);
  lines.push(`${c.city}, India`);
  lines.push("");
  lines.push(s.enclosed);

  const text = lines.join("\n");

  const wa = [
    lang === "hi"
      ? `मैंने Kavach से अपना अस्पताल बिल जाँचा। ${inr(demand)} की कटौती का पॉलिसी में कोई आधार नहीं है।`
      : lang === "kn"
        ? `Kavach ಬಳಸಿ ನನ್ನ ಆಸ್ಪತ್ರೆ ಬಿಲ್ ಪರಿಶೀಲಿಸಿದೆ. ${inr(demand)} ಕಡಿತಕ್ಕೆ ಪಾಲಿಸಿಯಲ್ಲಿ ಆಧಾರವಿಲ್ಲ.`
        : `I audited my hospital bill with Kavach. ${inr(demand)} of the TPA's deductions have no basis in my policy.`,
    "",
    `${c.hospital} · ${c.procedure}`,
    `${inr(a.billed)} billed · ${inr(demand)} disputed`,
    "",
    siteUrl,
  ].join("\n");

  return {
    lang,
    dateLabel,
    to: s.to,
    subject: s.subject(c.policy.claimNo, inr(demand)),
    text,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(wa)}`,
    demand: demand + hospitalTotal,
  };
}

/** Attach the source line item to each flag for rendering. */
export function flagsWithItems(c: DemoCase, a: Audit): (Flag & { item?: DemoCase["items"][number] })[] {
  return a.flags.map((f) => ({
    ...f,
    item: f.itemId ? c.items.find((i) => i.id === f.itemId) : undefined,
  }));
}