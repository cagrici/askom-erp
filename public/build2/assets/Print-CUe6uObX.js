import{j as e,B as t}from"./bootstrap-B-rMZa0z.js";import{Y as c}from"./inertia-KxZcYY3E.js";import"./vendor-CxCRd4AE.js";function h({products:n,settings:r}){const l=()=>{window.print()},o=i=>i?`₺${i.toLocaleString()}`:"",s=()=>{const[i,a]=r.label_size.split("x").map(m=>parseInt(m));return{width:`${i}mm`,height:`${a}mm`,minHeight:`${a}mm`}},d=()=>({gridTemplateColumns:`repeat(${r.columns}, 1fr)`});return e.jsxs("html",{children:[e.jsxs("head",{children:[e.jsx(c,{title:"Barkod Yazdırma Önizleme"}),e.jsx("style",{children:`
                    @media print {
                        body { margin: 0; }
                        .no-print { display: none !important; }
                        .print-grid {
                            display: grid;
                            gap: 2mm;
                            page-break-inside: avoid;
                        }
                        .barcode-label {
                            border: 1px solid #000;
                            padding: 1mm;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            text-align: center;
                            font-size: 8pt;
                            font-family: 'Courier New', monospace;
                            page-break-inside: avoid;
                        }
                        .barcode-text {
                            font-weight: bold;
                            margin: 1mm 0;
                            letter-spacing: 1px;
                        }
                        .product-name {
                            font-size: 7pt;
                            margin-bottom: 1mm;
                            word-wrap: break-word;
                            overflow: hidden;
                            text-overflow: ellipsis;
                            display: -webkit-box;
                            -webkit-line-clamp: 2;
                            -webkit-box-orient: vertical;
                        }
                        .price {
                            font-size: 9pt;
                            font-weight: bold;
                            margin-top: 1mm;
                        }
                    }

                    .print-grid {
                        display: grid;
                        gap: 3px;
                        margin: 10px;
                    }

                    .barcode-label {
                        border: 1px solid #ccc;
                        padding: 8px;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        text-align: center;
                        font-size: 12px;
                        font-family: 'Courier New', monospace;
                        background: white;
                    }

                    .barcode-text {
                        font-weight: bold;
                        margin: 4px 0;
                        letter-spacing: 1px;
                        font-size: 14px;
                    }

                    .product-name {
                        font-size: 10px;
                        margin-bottom: 4px;
                        word-wrap: break-word;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        display: -webkit-box;
                        -webkit-line-clamp: 2;
                        -webkit-box-orient: vertical;
                        line-height: 1.2;
                    }

                    .price {
                        font-size: 13px;
                        font-weight: bold;
                        margin-top: 4px;
                        color: #d63384;
                    }

                    .barcode-placeholder {
                        width: 80%;
                        height: 20px;
                        background: repeating-linear-gradient(90deg, #000 0px, #000 1px, #fff 1px, #fff 2px);
                        margin: 4px 0;
                    }
                `})]}),e.jsxs("body",{children:[e.jsx("div",{className:"no-print p-3 bg-light border-bottom",children:e.jsxs("div",{className:"d-flex justify-content-between align-items-center",children:[e.jsxs("div",{children:[e.jsx("h4",{className:"mb-1",children:"Barkod Yazdırma Önizleme"}),e.jsxs("p",{className:"text-muted mb-0",children:[n.length," ürün | ",r.label_size,"mm | ",r.columns," sütun | Tip: ",r.barcode_type]})]}),e.jsxs("div",{className:"d-flex gap-2",children:[e.jsxs(t,{variant:"primary",onClick:l,children:[e.jsx("i",{className:"ri-printer-line me-1"}),"Yazdır"]}),e.jsxs(t,{variant:"secondary",onClick:()=>window.history.back(),children:[e.jsx("i",{className:"ri-arrow-left-line me-1"}),"Geri Dön"]})]})]})}),e.jsx("div",{className:"print-grid",style:d(),children:n.map((i,a)=>e.jsxs("div",{className:"barcode-label",style:s(),children:[r.show_product_name&&e.jsx("div",{className:"product-name",children:i.name.length>25?i.name.substring(0,25)+"...":i.name}),e.jsx("div",{className:"barcode-placeholder"}),e.jsx("div",{className:"barcode-text",children:i.barcode}),r.show_price&&i.sale_price&&e.jsx("div",{className:"price",children:o(i.sale_price)})]},`${i.id}-${a}`))}),e.jsx("div",{className:"no-print p-3 bg-info bg-opacity-10 border-top",children:e.jsxs("div",{className:"d-flex align-items-center",children:[e.jsx("i",{className:"ri-information-line me-2 text-info"}),e.jsx("small",{className:"text-muted",children:"Bu bir önizlemedir. Gerçek barkodlar yazdırma sırasında oluşturulacaktır. Yazdırma öncesi etiket boyutlarını ve yazıcı ayarlarını kontrol edin."})]})})]})]})}export{h as default};
