import Header from '@/components/Header'

export default function Loading() {
  return (
    <>
      <Header />
      <div style={{ background: '#F8F7F4', minHeight: '100vh' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">

          {/* Back button */}
          <div className="h-4 w-20 rounded mb-8" style={{ background: '#EBEBEB' }} />

          <div className="flex flex-col lg:flex-row gap-12">

            {/* Image skeleton */}
            <div className="w-full lg:w-96 shrink-0">
              <div className="rounded-2xl" style={{ height: 420, background: '#F0F0F0' }} />
            </div>

            {/* Content skeleton */}
            <div className="flex-1 space-y-5">
              {/* Badges */}
              <div className="flex gap-2">
                <div className="h-5 w-16 rounded-full" style={{ background: '#EBEBEB' }} />
                <div className="h-5 w-14 rounded-full" style={{ background: '#EBEBEB' }} />
                <div className="h-5 w-20 rounded-full" style={{ background: '#EBEBEB' }} />
              </div>

              {/* Brand */}
              <div className="h-3 w-24 rounded" style={{ background: '#EBEBEB' }} />

              {/* Name */}
              <div className="h-8 w-64 rounded" style={{ background: '#EBEBEB' }} />

              {/* Price */}
              <div className="h-8 w-28 rounded" style={{ background: '#EBEBEB' }} />

              {/* Description */}
              <div className="space-y-2 pt-2">
                <div className="h-4 w-full rounded" style={{ background: '#EBEBEB' }} />
                <div className="h-4 w-full rounded" style={{ background: '#EBEBEB' }} />
                <div className="h-4 w-3/4 rounded" style={{ background: '#EBEBEB' }} />
              </div>

              {/* Notes */}
              <div className="space-y-3 pt-2">
                <div className="h-3 w-24 rounded" style={{ background: '#EBEBEB' }} />
                <div className="flex flex-wrap gap-2">
                  {[60, 80, 70, 55, 75].map((w, i) => (
                    <div key={i} className="h-7 rounded-full" style={{ width: w, background: '#EBEBEB' }} />
                  ))}
                </div>
              </div>

              {/* CTA button */}
              <div className="h-12 w-56 rounded-full mt-4" style={{ background: '#EBEBEB' }} />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
