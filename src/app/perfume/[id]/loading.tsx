import Header from '@/components/Header'
import ScrollToTop from '@/components/ui/ScrollToTop'

export default function Loading() {
  return (
    <>
      <ScrollToTop />
      <Header />
      <main className="mx-auto max-w-7xl px-5 pb-24 pt-8 sm:px-8">
        <div className="skeleton h-2.5 w-48 rounded-full" />
        <div className="mt-8 grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7 flex gap-4">
            <div className="hidden sm:flex flex-col gap-3">
              {[0, 1].map(i => <div key={i} className="skeleton h-24 w-20" />)}
            </div>
            <div className="skeleton aspect-[4/5] flex-1" />
          </div>
          <div className="lg:col-span-5 lg:pt-6">
            <div className="skeleton h-2.5 w-24 rounded-full" />
            <div className="skeleton mt-6 h-14 w-full rounded" />
            <div className="skeleton mt-3 h-14 w-2/3 rounded" />
            <div className="skeleton mt-8 h-3 w-1/2 rounded-full" />
            <div className="mt-8 border-y border-line py-6">
              <div className="skeleton h-10 w-32 rounded" />
            </div>
            <div className="mt-8 space-y-3">
              <div className="skeleton h-3 w-full rounded-full" />
              <div className="skeleton h-3 w-full rounded-full" />
              <div className="skeleton h-3 w-4/5 rounded-full" />
            </div>
            <div className="skeleton mt-10 h-[52px] w-full rounded-full" />
            <div className="skeleton mt-3 h-[52px] w-full rounded-full" />
          </div>
        </div>
      </main>
    </>
  )
}
