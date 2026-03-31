const p=()=>{document.querySelectorAll('[data-bs-toggle="dropdown"]').forEach(s=>{s.addEventListener("click",function(e){e.preventDefault(),e.stopPropagation(),document.querySelectorAll(".dropdown-menu.show").forEach(i=>{i!==this.nextElementSibling&&i.classList.remove("show")});const t=this.nextElementSibling;if(t&&t.classList.contains("dropdown-menu"))if(t.classList.contains("show"))t.classList.remove("show");else{const n=this.getBoundingClientRect(),d=w(t),l=window.innerHeight-n.bottom,r=n.top;t.classList.remove("dropdown-menu-end","dropup"),l<d&&r>d?(t.classList.add("dropup"),t.style.position="absolute",t.style.top="auto",t.style.bottom="100%"):(t.style.position="",t.style.top="",t.style.bottom="");const a=window.innerWidth-n.right,c=h(t);a<c&&t.classList.add("dropdown-menu-end"),t.classList.add("show")}})}),document.addEventListener("click",function(s){s.target.closest(".dropdown")||document.querySelectorAll(".dropdown-menu.show").forEach(t=>{t.classList.remove("show")})}),document.addEventListener("scroll",function(){document.querySelectorAll(".dropdown-menu.show").forEach(s=>{s.classList.remove("show")})},!0)},w=o=>{const s=!o.classList.contains("show");s&&(o.style.visibility="hidden",o.style.display="block",o.classList.add("show"));const e=o.offsetHeight;return s&&(o.classList.remove("show"),o.style.display="",o.style.visibility=""),e},h=o=>{const s=!o.classList.contains("show");s&&(o.style.visibility="hidden",o.style.display="block",o.classList.add("show"));const e=o.offsetWidth;return s&&(o.classList.remove("show"),o.style.display="",o.style.visibility=""),e},m=()=>{const o=document.createElement("style");o.textContent=`
        .table-responsive {
            overflow-x: auto;
            overflow-y: visible !important;
        }
        
        .dropdown-menu {
            z-index: 1050;
            max-height: 300px;
            overflow-y: auto;
        }
        
        .dropdown-menu.dropup {
            transform: translateY(-100%);
            margin-top: -2px !important;
        }
        
        .dropdown-menu.show {
            display: block;
        }
        
        /* Prevent dropdown from causing horizontal scroll */
        .table-responsive .dropdown {
            position: static;
        }
        
        .table-responsive .dropdown-menu {
            position: fixed !important;
            z-index: 1050;
        }
        
        /* Ensure dropdown stays in viewport */
        @media (max-width: 768px) {
            .dropdown-menu {
                position: fixed !important;
                left: 10px !important;
                right: 10px !important;
                width: auto !important;
                max-width: calc(100vw - 20px);
            }
        }
    `,document.head.appendChild(o)},y=()=>{m(),p()},f=()=>{document.querySelectorAll('[data-bs-toggle="dropdown"]').forEach(s=>{var t;const e=s.cloneNode(!0);(t=s.parentNode)==null||t.replaceChild(e,s)})};export{f as c,y as i};
