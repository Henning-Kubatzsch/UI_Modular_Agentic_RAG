'use client'

import { useEffect } from "react"

export function CSSRefresh(){
    useEffect(() => {
        if(process.env.NODE_ENV !== 'development') return;

        //CSS Reload Handler
        const reloadCSS = () => {
            const links = document.querySelectorAll('link[rel="stylesheet"]');
            links.forEach((link) => {
                const href = link.getAttribute('href');
            })
        }
    })
}