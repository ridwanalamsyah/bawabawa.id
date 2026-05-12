import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Clock } from "lucide-react";

type Params = { slug: string };

const POSTS: Record<string, {
  title: string;
  description: string;
  category: string;
  readTime: string;
  date: string;
  paragraphs: string[];
}> = {
  "panduan-belanja-pasar-baru-bandung": {
    title: "Panduan lengkap belanja di Pasar Baru Bandung untuk pemula",
    description:
      "Pasar Baru = surga fashion distro Bandung. Tapi kalau pertama kali, gampang nyasar & ditipu. Ini panduannya.",
    category: "Tips Belanja",
    readTime: "6 min",
    date: "12 Apr 2025",
    paragraphs: [
      "Pasar Baru di Bandung adalah salah satu destinasi belanja paling legendaris di Indonesia. Berdiri sejak 1906, kawasan ini dikenal sebagai pusat fashion grosir dengan harga distro yang super terjangkau.",
      "Tapi buat pemula yang baru pertama kali ke sini, Pasar Baru bisa terasa sangat membingungkan. Bangunan 8 lantai dengan ratusan kios, harga yang bisa berbeda 50%+ antar lapak, dan teknik tawar-menawar yang khas Bandung — semuanya bisa bikin pusing.",
      "Pertama, ketahuilah area khusus per lantai. Lantai 1–2 untuk perlengkapan haji & busana muslim. Lantai 3–4 fashion casual & distro. Lantai 5–6 textile & bahan kain. Lantai 7–8 bordir, aksesoris, dan tas.",
      "Tips menawar: harga awal biasanya bisa diturunkan 30–40%. Jangan beli di lapak pertama yang kamu lihat — keliling dulu 15–20 menit untuk benchmark harga.",
      "Dan kalau kamu tinggal di luar Bandung, jasa titip seperti Bawabawa.id bisa bantu kamu belanja di Pasar Baru tanpa harus datang langsung. Personal shopper kami sudah tahu lapak-lapak terpercaya dengan harga terbaik.",
    ],
  },
  "review-oleh-oleh-bandung-legendaris": {
    title: "10 oleh-oleh Bandung legendaris yang wajib dicicipi",
    description:
      "Kartika Sari pisang bollen, Amanda brownies kukus, bolu susu Lembang — kenapa orang Bandung sumpah cinta sama mereka.",
    category: "Kuliner",
    readTime: "8 min",
    date: "5 Apr 2025",
    paragraphs: [
      "Bandung punya warisan kuliner yang nggak ada matinya. Oleh-oleh khas kota ini banyak yang sudah berusia puluhan tahun dan tetap jadi favorit lintas generasi.",
      "1. Kartika Sari Pisang Bollen — pisang segar dibalut adonan pastry renyah dan keju. Sudah ada sejak 1979 dan masih jadi #1 oleh-oleh Bandung sampai sekarang.",
      "2. Amanda Brownies Kukus — brownies tekstur lembut, tidak terlalu manis, varian rasa lengkap dari original sampai matcha. Outlet ada di banyak titik.",
      "3. Bolu Susu Lembang — fenomenal karena rasa susunya yang medok dan tekstur fluffy. Outlet pusat di Lembang.",
      "4. Strudel Bandung — strudel khas Eropa adaptasi rasa lokal (durian, pisang, abon, nangka).",
      "5. Pia Bandung — pia tipis isi kacang hijau yang renyah dan ringan.",
      "6. Surabi Imut Bandung — surabi tradisional dengan topping modern. Outlet di Jl. Setiabudi.",
      "7. Tahu Susu Lembang — tahu putih dengan tekstur halus karena pakai susu murni.",
      "8. Kue Balok Mang Salam — kue balok klasik dengan butter dan keju.",
      "9. Cireng Banyur — cireng khas Bandung dengan saus pedas khasnya.",
      "10. Batagor Riri — batagor legendaris di Jl. Burangrang.",
    ],
  },
  "tips-jastip-aman-anti-tipu": {
    title: "5 tanda jasa titip aman vs penipu — cek dulu sebelum transfer",
    description: "Checklist anti-tipu sebelum kamu transfer ke jasa titip Instagram.",
    category: "Edukasi",
    readTime: "5 min",
    date: "28 Mar 2025",
    paragraphs: [
      "Setiap bulan kami mendengar ribuan kasus penipuan jastip di Instagram. Berikut 5 tanda yang harus kamu cek sebelum percaya:",
      "1. Profil bisnis terverifikasi atau punya domain web — bukan akun pribadi yang baru dibuat.",
      "2. Sistem escrow / pembayaran ditahan — dana tidak langsung masuk ke shopper, tapi ke perusahaan yang dirilis setelah barang sampai.",
      "3. Tracking realtime dengan nomor resi — bukan cuma kabar 'lagi packing' tanpa bukti.",
      "4. Customer service yang responsif di jam kerja — chat dijawab dalam 1 jam, bukan hilang berhari-hari.",
      "5. Review publik di Google Maps, Trustpilot, atau marketplace — bukan cuma testimoni screenshot WA yang gampang dipalsukan.",
      "Kalau jastip yang kamu pakai memenuhi 5 kriteria di atas, kemungkinan besar aman. Kalau tidak, lebih baik cari alternatif lain.",
    ],
  },
  "brand-distro-bandung-2025": {
    title: "Brand distro Bandung paling hits 2025",
    description: "Update terbaru brand distro Bandung yang lagi rising di 2025.",
    category: "Fashion",
    readTime: "7 min",
    date: "20 Mar 2025",
    paragraphs: [
      "Bandung selalu jadi kiblat fashion distro Indonesia. Tahun 2025, beberapa brand baru muncul dan brand lama makin solid.",
      "Erigo terus dominan di segmen casualwear dan sport-inspired. Eiger masih raja outdoor & adventure gear. 3Second tetap kuat di teen fashion.",
      "Brand baru yang naik 2025: Wakai (lifestyle sandals), Compass (sneakers premium), Brodo (formal-casual leather), dan Aksara Bandung (heritage-inspired streetwear).",
      "Untuk yang mau koleksi limited edition, banyak drop terbatas tiap bulan. Personal shopper Bawabawa siap antri & beli untuk kamu di Samarinda.",
    ],
  },
};

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const post = POSTS[slug];
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: { title: post.title, description: post.description, type: "article" },
  };
}

export async function generateStaticParams() {
  return Object.keys(POSTS).map((slug) => ({ slug }));
}

export default async function BlogPostPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const post = POSTS[slug];
  if (!post) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
      <Link
        href="/blog"
        className="inline-flex items-center gap-1.5 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Semua artikel
      </Link>

      <div className="mt-6 flex items-center gap-2 text-[11px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] font-medium">
        <span className="rounded-full bg-[hsl(var(--sage-100))] dark:bg-[hsl(var(--sage-900))] text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-200))] px-2 py-0.5">
          {post.category}
        </span>
        <span>·</span>
        <Calendar className="h-3 w-3" />
        {post.date}
        <span>·</span>
        <Clock className="h-3 w-3" />
        {post.readTime}
      </div>

      <h1 className="mt-4 text-3xl sm:text-4xl font-semibold tracking-tight leading-tight">
        {post.title}
      </h1>

      <div className="mt-8 space-y-5 text-[hsl(var(--foreground))] leading-relaxed">
        {post.paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </article>
  );
}
