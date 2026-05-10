import { ModuleShell } from "../../shared/ui/ModuleShell";

export function HrPage() {
  return (
    <ModuleShell
      title="SDM & Penggajian"
      subtitle="Kelola karyawan, absensi harian, dan penggajian bulanan dalam satu sistem terintegrasi."
      empty={{
        icon: "👥",
        title: "Modul SDM siap diaktifkan",
        description:
          "Tambahkan karyawan untuk mulai mencatat absensi, mengelola kontrak, dan menjalankan penggajian bulanan."
      }}
    />
  );
}
