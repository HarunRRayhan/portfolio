import * as React from "react"
import useEmblaCarousel from "embla-carousel-react"
import { cn } from "@/lib/utils"

const CarouselContext = React.createContext<any>(null)

function useCarousel() {
  const context = React.useContext(CarouselContext)
  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />")
  }
  return context
}

const Carousel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { opts?: any }
>(({ opts, className, children, ...props }, ref) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ ...opts })

  const carouselRef = React.useRef<HTMLDivElement>(null)

  return (
    <CarouselContext.Provider value={{ carouselRef, emblaApi }}>
      <div
        ref={ref}
        className={cn("relative", className)}
        {...props}
      >
        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex">
            {children}
          </div>
        </div>
      </div>
    </CarouselContext.Provider>
  )
})
Carousel.displayName = "Carousel"

const CarouselContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex", className)} {...props} />
))
CarouselContent.displayName = "CarouselContent"

const CarouselItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "min-w-0 shrink-0 grow-0 basis-full",
      className
    )}
    {...props}
  />
))
CarouselItem.displayName = "CarouselItem"

const CarouselPrevious = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => {
  const { emblaApi } = useCarousel()

  return (
    <button
      ref={ref}
      onClick={() => emblaApi?.scrollPrev()}
      className={cn(
        "absolute left-4 top-1/2 -translate-y-1/2 rounded-full",
        className
      )}
      {...props}
    />
  )
})
CarouselPrevious.displayName = "CarouselPrevious"

const CarouselNext = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => {
  const { emblaApi } = useCarousel()

  return (
    <button
      ref={ref}
      onClick={() => emblaApi?.scrollNext()}
      className={cn(
        "absolute right-4 top-1/2 -translate-y-1/2 rounded-full",
        className
      )}
      {...props}
    />
  )
})
CarouselNext.displayName = "CarouselNext"

export {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} 