import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { prisma } from "@/lib/db";
import { addClassroom, addStudent, deleteClassroom, deleteStudent } from "./actions";

export const dynamic = "force-dynamic";

export default async function SinflarPage() {
  const classrooms = await prisma.classroom.findMany({
    orderBy: { grade: "asc" },
    include: {
      students: {
        orderBy: { firstName: "asc" },
        include: { _count: { select: { responses: true } } },
      },
    },
  });

  return (
    <>
      <h1 className="text-3xl font-extrabold">Sinflar va o&apos;quvchilar</h1>
      <p className="mt-2 text-[var(--ink-soft)]">
        O&apos;quvchining faqat ismi va familiya bosh harfi saqlanadi. O&apos;chirish —
        qaytarilmaydi: o&apos;quvchi bilan birga uning barcha javoblari va baholari ham
        o&apos;chadi.
      </p>

      <form action={addClassroom} className="card mt-8 flex flex-wrap items-end gap-3 p-5">
        <div>
          <label htmlFor="yangi-sinf" className="mb-1 block text-sm font-bold text-[var(--ink-soft)]">
            Yangi sinf nomi
          </label>
          <input
            id="yangi-sinf"
            name="name"
            required
            maxLength={30}
            placeholder="3-V sinf"
            className="field w-44 p-2.5"
          />
        </div>
        <div>
          <label htmlFor="yangi-daraja" className="mb-1 block text-sm font-bold text-[var(--ink-soft)]">
            Daraja (norma)
          </label>
          <select id="yangi-daraja" name="grade" className="field p-2.5">
            {[1, 2, 3, 4].map((g) => (
              <option key={g} value={g}>
                {g}-sinf
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn btn-primary">
          Sinf qo&apos;shish
        </button>
      </form>

      <div className="mt-8 space-y-6">
        {classrooms.map((classroom) => (
          <section key={classroom.id} className="card p-5">
            <div className="flex flex-wrap items-baseline gap-3">
              <h2 className="text-xl font-extrabold">{classroom.name}</h2>
              <span className="text-sm text-[var(--ink-soft)]">
                {classroom.grade}-sinf normasi · {classroom.students.length} o&apos;quvchi
              </span>
              <form action={deleteClassroom} className="ml-auto">
                <input type="hidden" name="id" value={classroom.id} />
                <ConfirmSubmit
                  message={`"${classroom.name}" sinfini o'chirasizmi? ${classroom.students.length} ta o'quvchi va ularning BARCHA javoblari qaytarib bo'lmas tarzda o'chadi.`}
                  className="text-sm font-bold text-[var(--warn)] hover:underline"
                >
                  Sinfni o&apos;chirish
                </ConfirmSubmit>
              </form>
            </div>

            <ul className="mt-4 flex flex-wrap gap-2">
              {classroom.students.map((student) => (
                <li
                  key={student.id}
                  className="flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface-sunk)] py-1 pl-3 pr-2 text-sm"
                >
                  <span className="font-bold">
                    {student.firstName} {student.lastInitial}.
                  </span>
                  <span className="text-[var(--ink-soft)]">{student._count.responses} javob</span>
                  <form action={deleteStudent}>
                    <input type="hidden" name="id" value={student.id} />
                    <ConfirmSubmit
                      ariaLabel={`${student.firstName} ni o'chirish`}
                      message={`${student.firstName} ${student.lastInitial}. ni o'chirasizmi?${
                        student._count.responses > 0
                          ? ` ${student._count.responses} ta javobi va baholari ham qaytarib bo'lmas tarzda o'chadi.`
                          : ""
                      }`}
                      className="flex h-5 w-5 items-center justify-center rounded-full font-bold text-[var(--warn)] hover:bg-[color-mix(in_oklab,var(--warn)_15%,transparent)]"
                    >
                      ×
                    </ConfirmSubmit>
                  </form>
                </li>
              ))}
              {classroom.students.length === 0 && (
                <li className="text-sm text-[var(--ink-soft)]">Hali o&apos;quvchi yo&apos;q.</li>
              )}
            </ul>

            <form action={addStudent} className="mt-4 flex flex-wrap items-end gap-2">
              <input type="hidden" name="classroomId" value={classroom.id} />
              <div>
                <label
                  htmlFor={`ism-${classroom.id}`}
                  className="mb-1 block text-xs font-bold text-[var(--ink-soft)]"
                >
                  Ism
                </label>
                <input
                  id={`ism-${classroom.id}`}
                  name="firstName"
                  required
                  maxLength={30}
                  placeholder="Nodira"
                  className="field w-36 p-2 text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor={`harf-${classroom.id}`}
                  className="mb-1 block text-xs font-bold text-[var(--ink-soft)]"
                >
                  Familiya harfi
                </label>
                <input
                  id={`harf-${classroom.id}`}
                  name="lastInitial"
                  required
                  maxLength={1}
                  placeholder="A"
                  className="field w-16 p-2 text-center text-sm uppercase"
                />
              </div>
              <button type="submit" className="btn btn-quiet px-4 py-2 text-sm">
                Qo&apos;shish
              </button>
            </form>
          </section>
        ))}
      </div>
    </>
  );
}
