
import type React from "react"
import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface HeroImage {
  id: number
  url: string
  title: string
}

const heroImages: HeroImage[] = [
  {
    id: 1,
    url: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2000&q=80",
    title: "Concert Events",
  },
  {
    id: 2,
    url: "https://images.unsplash.com/photo-1560479284-ec171c33a110?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=2070",
    title: "Food Events",
  },
  {
    id: 3,
    url: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=2070",
    title: "Tech Conferences",
  },
  {
    id: 4,
    url: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=2070",
    title: "Festivals",
  },
  {
    id: 5,
    url: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=2070",
    title: "Networking Events",
  },
]

export const HeroCarousel: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [autoPlay, setAutoPlay] = useState(true)

  useEffect(() => {
    if (!autoPlay) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroImages.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [autoPlay])

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
    setAutoPlay(false)
    setTimeout(() => setAutoPlay(true), 7000)
  }

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % heroImages.length)
    setAutoPlay(false)
    setTimeout(() => setAutoPlay(true), 7000)
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + heroImages.length) % heroImages.length)
    setAutoPlay(false)
    setTimeout(() => setAutoPlay(true), 7000)
  }

  return (
    <section className="relative w-full h-[70vh] overflow-hidden">
      {/* Background Carousel */}
      <div className="absolute inset-0 w-full h-full">
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center transition-all duration-500"
          style={{
            backgroundImage: `url(${heroImages[currentIndex].url})`,
          }}
        />
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Content Overlay */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <div className="text-center text-white px-4 md:px-8">
          {/* <div>
            <h1 className="text-4xl md:text-6xl font-bold mb-4 text-balance">{heroImages[currentIndex].title}</h1>
            <p className="text-lg md:text-xl text-white/90">{heroImages[currentIndex].description}</p>
          </div> */}
          {children}
        </div>
      </div>

      {/* Navigation Buttons */}
      <button
        onClick={prevSlide}
        className="absolute left-4 md:left-8 top-1/2 transform -translate-y-1/2 z-20 bg-white/20 hover:bg-white/40 backdrop-blur-md p-2 md:p-3 rounded-full transition-all duration-300 hover:scale-110"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-6 w-6 md:h-8 md:w-8 text-white" />
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-4 md:right-8 top-1/2 transform -translate-y-1/2 z-20 bg-white/20 hover:bg-white/40 backdrop-blur-md p-2 md:p-3 rounded-full transition-all duration-300 hover:scale-110"
        aria-label="Next slide"
      >
        <ChevronRight className="h-6 w-6 md:h-8 md:w-8 text-white" />
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-6 md:bottom-8 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
        {heroImages.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`transition-all duration-300 rounded-full ${
              index === currentIndex ? "bg-white w-8 h-2" : "bg-white/50 hover:bg-white/75 w-2 h-2"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Image Counter */}
      <div className="absolute top-6 md:top-8 right-6 md:right-8 z-20 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full text-white text-sm font-medium">
        {currentIndex + 1} / {heroImages.length}
      </div>
    </section>
  )
}

export default HeroCarousel
