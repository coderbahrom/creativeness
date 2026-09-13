-- Eski yozuvlar uchun: o'qituvchi tegmagan baholarda hozirgi qiymat aynan
-- AI qo'ygan qiymat. Tahrirlangan yozuvlarda asl baho yo'qolgan — ular null
-- bo'lib qoladi (soxta ma'lumot yozilmaydi).
UPDATE "Assessment"
SET "aiFluency" = "fluency",
    "aiFlexibility" = "flexibility",
    "aiOriginality" = "originality",
    "aiElaboration" = "elaboration"
WHERE "teacherEdited" = 0 AND "aiFluency" IS NULL;
