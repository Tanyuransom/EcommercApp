import Link from "next/link";
import {getTranslations} from "next-intl/server";
import {redirect} from "next/navigation";
import {formatXaf} from "@/lib/format";
import {prisma} from "@/lib/prisma";
import {routing} from "@/i18n/routing";
import {auth} from "@/lib/auth";
import {sessionHasPermission} from "@/lib/rbac";
import {extractSizePricing, formatSizePricingSummary} from "@/lib/product-pricing";

export default async function HomePage({
  params,
}: {
  params?: {locale: string};
}) {
  const locale = params?.locale ?? routing.defaultLocale;
  const session = await auth();
  const isAdminUser =
    sessionHasPermission(session, "orders.read") ||
    sessionHasPermission(session, "payments.review") ||
    sessionHasPermission(session, "reports.read") ||
    sessionHasPermission(session, "roles.manage") ||
    sessionHasPermission(session, "orders.write");

  if (isAdminUser) {
    redirect(`/${locale}/admin/orders`);
  }

  const t = await getTranslations({locale, namespace: "home"});
  const featuredProducts = await prisma.product.findMany({
    where: {
      isPublished: true,
      deletedAt: null,
      images: {
        some: {},
      },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      productType: true,
        description: true,
      salePrice: true,
      images: {
        where: {
          isPrimary: true,
        },
        take: 1,
        select: {
          url: true,
          altText: true,
        },
      },
      stock: {
        select: {
          quantityOnHand: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 8,
  });

  const promoBadges = [t("promo.hot"), t("promo.fastShip"), t("promo.topSupplier")];

  return (
    <section className="w-full overflow-x-hidden space-y-8 animate-fade-up">
      <article className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/40 backdrop-blur-xl px-5 py-10 sm:px-8 sm:py-16 lg:px-12 lg:py-20 shadow-2xl shadow-rose-gold-300/10 animate-fade-up-delay-1">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-rose-gold-300/35 blur-3xl mix-blend-multiply opacity-80" />
        <div className="absolute -bottom-24 -left-12 h-96 w-96 rounded-full bg-cream-200/50 blur-3xl mix-blend-multiply opacity-90" />
        <div className="relative max-w-4xl space-y-5 sm:space-y-7">
          <span className="inline-flex rounded-full border border-charcoal-900/10 bg-white/90 px-4.5 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-charcoal-700 shadow-sm">
            {t("badge")}
          </span>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-7xl leading-tight text-charcoal-900 tracking-tight">
            {t("headline")}
          </h1>
          <p className="max-w-3xl text-sm sm:text-base lg:text-xl leading-relaxed text-charcoal-700">
            {t("subheadline")}
          </p>
          <div className="flex flex-wrap gap-3 sm:gap-4 pt-2">
            <Link
              href={`/${locale}/products`}
              className="rounded-full bg-charcoal-900 px-6 sm:px-8 py-3 sm:py-4 text-xs sm:text-sm font-semibold uppercase tracking-[0.08em] text-cream-50 transition-all hover:bg-charcoal-800 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-charcoal-900/15 active:translate-y-0"
            >
              {t("ctaProducts")}
            </Link>
            <Link
              href={`/${locale}/auth/sign-in`}
              className="rounded-full border border-charcoal-900/20 bg-white/65 backdrop-blur px-6 sm:px-8 py-3 sm:py-4 text-xs sm:text-sm font-semibold uppercase tracking-[0.08em] text-charcoal-900 transition-all hover:bg-cream-100/90 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
            >
              {t("ctaConnect")}
            </Link>
          </div>
          <div className="flex flex-wrap gap-2 pt-4">
            {promoBadges.map((badge) => (
              <span key={badge} className="rounded-full border border-charcoal-900/10 bg-white/90 px-3.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.1em] text-charcoal-700 shadow-sm">
                {badge}
              </span>
            ))}
          </div>
        </div>
      </article>

      <article className="rounded-3xl border border-white/60 bg-white/35 backdrop-blur-md p-5 sm:p-8 shadow-xl shadow-charcoal-900/5 animate-fade-up-delay-2">
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-charcoal-900/5 pb-4">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl text-charcoal-900 tracking-tight">{t("featuredTitle")}</h2>
            <p className="mt-1 text-xs sm:text-sm text-charcoal-600">Handpicked items for your premium look</p>
          </div>
          <Link href={`/${locale}/products`} className="text-xs sm:text-sm font-semibold text-charcoal-800 underline hover:text-charcoal-900 transition-colors">
            {t("seeAll")}
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {featuredProducts.map((product, index) => {
            const badge = promoBadges[index % promoBadges.length];
            const sizeSummary = formatSizePricingSummary(extractSizePricing(`${product.name}\n${product.description ?? ""}`), 2);
            return (
              <Link key={product.id} href={`/${locale}/products/${product.slug}`} className="group rounded-2xl border border-charcoal-900/8 bg-white/85 p-3 transition-all hover:border-charcoal-900/18 hover:shadow-2xl alive-hover duration-300">
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-rose-gold-200/35 via-cream-100 to-charcoal-300/20">
                  {product.images[0]?.url ? (
                    <img
                      src={product.images[0].url}
                      alt={product.images[0].altText ?? product.name}
                      className="h-48 w-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
                    />
                  ) : (
                    <div className="flex h-48 items-center justify-center text-xs font-semibold uppercase tracking-[0.08em] text-charcoal-700">
                      {product.productType}
                    </div>
                  )}
                  <span className="absolute left-2.5 top-2.5 rounded-full bg-charcoal-900/90 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-cream-50 shadow-sm">
                    {badge}
                  </span>
                </div>

                <div className="mt-4 space-y-1.5">
                  <p className="line-clamp-1 text-base font-semibold text-charcoal-900 tracking-tight group-hover:text-charcoal-700 transition-colors">{product.name}</p>
                  <p className="text-sm font-bold text-charcoal-800">
                    {product.salePrice ? formatXaf(Number(product.salePrice), locale) : sizeSummary || t("priceOnRequest")}
                  </p>
                  {sizeSummary ? <p className="text-xs text-charcoal-600">{sizeSummary}</p> : null}
                  <div className="flex items-center justify-between pt-1 border-t border-charcoal-900/5 mt-2">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.05em] ${(product.stock?.quantityOnHand ?? 0) > 0 ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50" : "bg-rose-50 text-rose-700 border border-rose-200/50"}`}>
                      {(product.stock?.quantityOnHand ?? 0) > 0
                        ? t("stockNow", {count: product.stock?.quantityOnHand ?? 0})
                        : t("stockOut")}
                    </span>
                    <span className="text-[11px] font-semibold text-charcoal-500 group-hover:text-charcoal-900 transition-colors flex items-center gap-0.5">
                      Buy now <span className="translate-x-0 group-hover:translate-x-0.5 transition-transform">→</span>
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </article>
    </section>
  );
}
