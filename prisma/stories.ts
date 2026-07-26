/**
 * MVP kontenti: o'zbek xalq ertaklari (mualliflik huquqi muammosi yo'q — 10-bo'lim).
 * Matnlar sinf darajasiga moslashtirilgan qisqa qayta hikoyalar.
 */

export type SeedTask = {
  order: number;
  type:
    | "davom_ettirish"
    | "almashtirish"
    | "boshqa_koz"
    | "agar"
    | "boyitish"
    | "muqobil_yakun"
    | "yangi_personaj"
    | "muammo_yechish";
  prompt: string;
  criterion: "fluency" | "flexibility" | "originality" | "elaboration";
};

export type SeedStory = {
  slug: string;
  title: string;
  gradeMin: number;
  gradeMax: number;
  summary: string;
  body: string;
  questions: { order: number; prompt: string; options: string[]; correctIndex: number }[];
  tasks: SeedTask[];
};

export const STORIES: SeedStory[] = [
  {
    slug: "susambil",
    title: "Susambil",
    gradeMin: 1,
    gradeMax: 2,
    summary: "Qari ho'kiz o'ziga yaxshi yurt izlab yo'lga chiqadi va yo'lda do'st orttiradi.",
    body: `Bir bor ekan, bir yo'q ekan. Bir qishloqda qari ho'kiz bor ekan. U yosh vaqtida ko'p ishlagan, endi kuchi qolmagan ekan. Xo'jayin unga: "Sendan foyda yo'q", — debdi.

Ho'kiz xafa bo'lib, yo'lga chiqibdi. Yo'lda unga eshak duch kelibdi.
— Qayoqqa ketyapsan? — debdi eshak.
— Susambilga ketyapman. U yerda o't ko'p, suv toza, hech kim urishmaydi, — debdi ho'kiz.
— Meni ham olib ket, — debdi eshak.

Ular birga ketishibdi. Yo'lda xo'roz, so'ng it ham qo'shilibdi. To'rtovi ham qariyib qolgan, to'rtovi ham uydan haydalgan ekan.

Kech kirganda ular kimsasiz bir kulbani ko'rishibdi. Ichkarida chiroq yonar ekan. Ular derazadan mo'ralashsa — kulbada bo'rilar o'tirgan ekan.

Ho'kiz sekin dedi:
— Qo'rqmanglar. Hammamiz birga bo'lsak, kuchimiz yetadi.

Xo'roz qichqiribdi, it hurib yuboribdi, eshak hangrabdi, ho'kiz esa eshikni shox bilan urib ochibdi. Bo'rilar qo'rqib, o'rmonga qochib ketishibdi.

Shu kulba to'rt do'stga uy bo'libdi. Ular Susambilga yetib bormagan ekan-u, lekin Susambilni o'zlari yaratishibdi.`,
    questions: [
      {
        order: 1,
        prompt: "Ho'kiz nima uchun uydan ketdi?",
        options: ["Susambilni ko'rgisi keldi", "Xo'jayin uni keraksiz dedi", "Do'st izladi"],
        correctIndex: 1,
      },
      {
        order: 2,
        prompt: "Yo'lda ho'kizga kimlar qo'shildi?",
        options: ["Eshak, xo'roz, it", "Tulki, bo'ri, ayiq", "Quyon, sichqon, mushuk"],
        correctIndex: 0,
      },
      {
        order: 3,
        prompt: "Do'stlar bo'rilarni qanday quvib chiqarishdi?",
        options: ["Yashirinib ketishdi", "Birga shovqin ko'tarishdi", "Yordam so'rashdi"],
        correctIndex: 1,
      },
    ],
    tasks: [
      {
        order: 1,
        type: "davom_ettirish",
        prompt: "Ertak shu yerda tugadi. Ertasi kuni ertalab kulbada nima bo'ldi?",
        criterion: "fluency",
      },
      {
        order: 2,
        type: "yangi_personaj",
        prompt: "To'rt do'stga yana bitta hayvon qo'shildi. U kim va u nima qila oladi?",
        criterion: "fluency",
      },
      {
        order: 3,
        type: "boyitish",
        prompt: "Kulbani tasvirlab ber: u yerda nima ko'rinyapti, qanday hid bor, qanday ovoz eshitiladi?",
        criterion: "elaboration",
      },
      {
        order: 4,
        type: "boshqa_koz",
        prompt: "Shu voqeani bo'rilardan biri aytib bersa, u qanday aytardi?",
        criterion: "originality",
      },
      {
        order: 5,
        type: "agar",
        prompt: "Agar ho'kiz yo'lda yolg'iz qolganida, ertak qanday davom etardi?",
        criterion: "flexibility",
      },
    ],
  },
  {
    slug: "ur-toqmoq",
    title: "Ur, to'qmoq!",
    gradeMin: 2,
    gradeMax: 3,
    summary: "Kambag'al chol sehrli sovg'alar oladi, ochko'z qo'shni esa ularni tortib oladi.",
    body: `Burun zamonda bir kambag'al chol bo'lgan ekan. Uning bittagina echkisi bor ekan.

Bir kuni echki yo'qolib qolibdi. Chol uni izlab tog'ga chiqibdi. Tog'da bir qarindosh cholni ko'ribdi va aytibdi:
— Sen menga yaxshilik qilgansan. Mana senga dasturxon. Uni ochsang, taom to'la bo'ladi.

Chol quvonib uyiga qaytibdi. Yo'lda qo'shnisiga uchrabdi. Qo'shni juda ochko'z odam ekan. U dasturxonni ko'rib:
— Bir kechaga ber, ertaga qaytaraman, — debdi.

Ertasiga qaytarganda dasturxon oddiy latta bo'lib qolibdi. Qo'shni uni almashtirib qo'ygan ekan.

Chol yana tog'ga chiqibdi. Bu safar unga tegirmon berishibdi — aylantirsang, un chiqadi. Qo'shni buni ham almashtirib olibdi.

Uchinchi marta chiqqanida cholga bir sandiq berishibdi va dedilar:
— Buning ichida to'qmoq bor. Ochsang, "Ur, to'qmoq!" degin.

Qo'shni bu safar ham sandiqni so'rab olibdi. Uyiga borib, shosha-pisha sandiqni ochibdi va baqiribdi:
— Ur, to'qmoq!

To'qmoq chiqib, qo'shnini quva boshlabdi. Qo'shni yugurib chiqib, cholning oyog'iga yiqilibdi:
— Kechir meni! Hammasini qaytaraman!

Chol to'qmoqni to'xtatibdi. Qo'shni dasturxon bilan tegirmonni qaytaribdi. Shundan keyin u boshqa hech kimning narsasiga ko'z olaytirmabdi.`,
    questions: [
      {
        order: 1,
        prompt: "Chol tog'ga birinchi marta nima uchun chiqdi?",
        options: ["Sovg'a olish uchun", "Yo'qolgan echkisini izlab", "Qo'shnisidan qochib"],
        correctIndex: 1,
      },
      {
        order: 2,
        prompt: "Qo'shni sovg'alar bilan nima qildi?",
        options: ["Almashtirib qo'ydi", "Sotib yubordi", "Sindirib tashladi"],
        correctIndex: 0,
      },
      {
        order: 3,
        prompt: "Qo'shni nima uchun kechirim so'radi?",
        options: ["Chol yig'ladi", "To'qmoq uni quvdi", "Echki qaytib keldi"],
        correctIndex: 1,
      },
    ],
    tasks: [
      {
        order: 1,
        type: "muqobil_yakun",
        prompt: "Bu ertakni to'qmoqsiz tugatib bo'ladimi? Qo'shni yana qanday yo'l bilan o'zgarishi mumkin edi?",
        criterion: "originality",
      },
      {
        order: 2,
        type: "almashtirish",
        prompt: "Sandiq ichida to'qmoq emas, boshqa narsa bo'lsa — ertak qanday o'zgaradi?",
        criterion: "flexibility",
      },
      {
        order: 3,
        type: "boshqa_koz",
        prompt: "Shu voqeani qo'shni o'zi aytib bersa, u nimalarni aytardi?",
        criterion: "originality",
      },
      {
        order: 4,
        type: "muammo_yechish",
        prompt: "Cholga yordam berishning 3 xil yo'lini o'ylab top.",
        criterion: "fluency",
      },
      {
        order: 5,
        type: "boyitish",
        prompt: "Sandiq ochilgan lahzani tasvirlab ber: qo'shni nima his qildi, nima ko'rdi, nima eshitdi?",
        criterion: "elaboration",
      },
      {
        order: 6,
        type: "davom_ettirish",
        prompt: "Oradan bir yil o'tdi. Chol bilan qo'shni endi qanday yashayapti?",
        criterion: "fluency",
      },
    ],
  },
  {
    slug: "tulki-bilan-turna",
    title: "Tulki bilan turna",
    gradeMin: 3,
    gradeMax: 4,
    summary: "Tulki turnani mehmonga chaqiradi, lekin unga taom yeyish imkonini bermaydi.",
    body: `Tulki bilan turna do'st bo'lishibdi. Bir kuni tulki turnani mehmonga chaqiribdi.

— Kel, do'stim, men senga shirin osh pishiraman, — debdi u.

Turna quvonib boribdi. Tulki bo'tqa pishirib, uni yassi laganga surtib qo'yibdi.
— Marhamat, ol, — debdi tulki.

Turnaning uzun tumshug'i lagandan hech narsa ola olmabdi. U shu yerda turib, tumshug'ini yerga urib qo'yibdi, xolos. Tulki esa bo'tqani yalab-yalab tugatibdi va:
— Kechirasan, boshqa taom yo'q edi, — debdi.

Turna hech narsa demay uyiga qaytibdi. Ammo ertasiga u tulkini chaqiribdi:
— Endi sen menikiga kel.

Tulki quvonib boribdi. Turna esa go'shtli sho'rvani uzun bo'yinli, tor og'izli ko'zaga solib qo'ygan ekan.
— Marhamat, ol, — debdi turna va tumshug'ini ko'zaga tiqib, sho'rvani ichaveribdi.

Tulki ko'zaning atrofida aylanibdi, hidlabdi, tilini tiqmoqchi bo'libdi — hech nima chiqmabdi. Och qorin uyiga qaytibdi.

Shundan keyin tulki bilan turnaning do'stligi sovubdi. Chunki do'stlik faqat chaqirish bilan emas, boshqani tushunish bilan bo'lar ekan.`,
    questions: [
      {
        order: 1,
        prompt: "Tulki bo'tqani nimaga solib qo'ydi?",
        options: ["Chuqur kosaga", "Yassi laganga", "Tor og'izli ko'zaga"],
        correctIndex: 1,
      },
      {
        order: 2,
        prompt: "Turna nima uchun tulkini ko'zada mehmon qildi?",
        options: [
          "Boshqa idishi yo'q edi",
          "Tulkiga o'zini tushuntirmoqchi bo'ldi",
          "Sho'rva issiq edi",
        ],
        correctIndex: 1,
      },
      {
        order: 3,
        prompt: "Ertak oxirida do'stlik nima uchun sovudi?",
        options: [
          "Ikkovi bir-birini tushunmadi",
          "Ular uzoqda yashardi",
          "Boshqa do'st topishdi",
        ],
        correctIndex: 0,
      },
    ],
    tasks: [
      {
        order: 1,
        type: "muqobil_yakun",
        prompt: "Bu ertakni do'stlik saqlanib qoladigan qilib tugatib ko'r. Nima boshqacha bo'lishi kerak edi?",
        criterion: "originality",
      },
      {
        order: 2,
        type: "boshqa_koz",
        prompt: "Shu voqeani ko'za o'zi ko'rgan bo'lsa, u nimalarni aytib berardi?",
        criterion: "originality",
      },
      {
        order: 3,
        type: "muammo_yechish",
        prompt: "Ikkovi ham to'yib ovqatlanishi uchun 3 xil yo'l o'ylab top.",
        criterion: "fluency",
      },
      {
        order: 4,
        type: "agar",
        prompt: "Agar tulki turnaning tumshug'i haqida oldindan o'ylaganida, mehmondorchilik qanday o'tardi?",
        criterion: "flexibility",
      },
      {
        order: 5,
        type: "boyitish",
        prompt: "Turnaning uyini tasvirlab ber: u yerda nima bor, qanday hid keladi, tulki nima his qilyapti?",
        criterion: "elaboration",
      },
      {
        order: 6,
        type: "yangi_personaj",
        prompt: "Ertakka uchinchi qahramon qo'sh. U kelganda nima o'zgaradi?",
        criterion: "fluency",
      },
    ],
  },
];

export const CLASSROOMS = [
  {
    name: "2-A sinf",
    grade: 2,
    students: [
      ["Dilnoza", "R"],
      ["Javohir", "T"],
      ["Malika", "S"],
      ["Bekzod", "N"],
      ["Sevinch", "A"],
      ["Otabek", "Q"],
      ["Nilufar", "M"],
      ["Sardor", "X"],
      ["Zilola", "B"],
      ["Aziz", "K"],
      ["Gulnoza", "D"],
      ["Islom", "Y"],
      ["Madina", "O"],
      ["Doniyor", "P"],
      ["Shahzoda", "E"],
      ["Ulug'bek", "G"],
      ["Kamola", "Z"],
      ["Temur", "I"],
    ],
  },
  {
    name: "4-B sinf",
    grade: 4,
    students: [
      ["Asal", "V"],
      ["Rustam", "L"],
      ["Ziyoda", "H"],
      ["Jasur", "F"],
      ["Nodira", "C"],
      ["Alisher", "J"],
      ["Mohira", "U"],
      ["Firdavs", "W"],
      ["Robiya", "S"],
      ["Sanjar", "T"],
      ["Umida", "N"],
      ["Bobur", "A"],
      ["Laylo", "R"],
      ["Anvar", "M"],
      ["Sitora", "K"],
      ["Xurshid", "B"],
    ],
  },
];
