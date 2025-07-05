import { useState, useEffect } from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false) // Default to false for server-side rendering

  useEffect(() => {
    // This function checks the window width and updates the state
    const checkDevice = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }

    // Check the device on initial mount
    checkDevice()

    // Add event listener for window resize
    window.addEventListener("resize", checkDevice)

    // Cleanup the event listener on component unmount
    return () => {
      window.removeEventListener("resize", checkDevice)
    }
  }, []) // Empty dependency array ensures this effect runs only on the client, after mount

  return isMobile
}
