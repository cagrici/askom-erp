// Import Images
import dribble from "../../../images/brands/dribbble.png"
import bitbucket from "../../../images/brands/bitbucket.png";
import dropbox from "../../../images/brands/dropbox.png";
import mail_chimp from "../../../images/brands/mail_chimp.png";
import slack from "../../../images/brands/slack.png";
import github from "../../../images/brands/github.png";

import company1 from "../../../images/companies/img-1.png";
import company3 from "../../../images/companies/img-3.png";
import company4 from "../../../images/companies/img-4.png";
import company5 from "../../../images/companies/img-5.png";
import company6 from "../../../images/companies/img-6.png";
import company8 from "../../../images/companies/img-8.png";

// Suppliers Data
const suppliers: any = [
    {
        id: 1,
        supplierId: "#SUP001",
        picture: dribble,
        companyName: "Nesta Technologies",
        contactPerson: "Tonya Noble",
        category: "IT Equipment",
        rating: "4.5",
        location: "Los Angeles, USA",
        employee: "11-50",
        website: "www.nestatechnologies.com",
        contact: "info@nestatechnologies.com",
        since: "1995",
        status: "Active",
        paymentTerms: "Net 30",
        tags: ["Hardware", "Software"]
    },
    {
        id: 2,
        supplierId: "#SUP002",
        picture: bitbucket,
        companyName: "iTest Factory",
        contactPerson: "Thomas Taylor",
        category: "Chemical Industry",
        rating: "3.8",
        location: "Berlin, Germany",
        employee: "11-50",
        website: "www.itestfactory.com",
        contact: "info@itestfactory.com",
        since: "1998",
        status: "Active",
        paymentTerms: "Net 45",
        tags: ["Chemicals", "Manufacturing"]
    },
    {
        id: 3,
        supplierId: "#SUP003",
        picture: company8,
        companyName: "Force Medicines",
        contactPerson: "Glen Matney",
        category: "Medical Supplies",
        rating: "4.1",
        location: "Phoenix, USA",
        employee: "51-100",
        website: "www.forcemedicines.com",
        contact: "info@forcemedicines.com",
        since: "2000",
        status: "Active",
        paymentTerms: "Net 30",
        tags: ["Pharma", "Healthcare"]
    },
    {
        id: 4,
        supplierId: "#SUP004",
        picture: company1,
        companyName: "Digitech Galaxy",
        contactPerson: "Alexis Clarke",
        category: "Telecommunications",
        rating: "3.2",
        location: "Bogota, Colombia",
        employee: "101-200",
        website: "www.digitechgalaxy.com",
        contact: "info@digitechgalaxy.com",
        since: "2005",
        status: "Inactive",
        paymentTerms: "Net 60",
        tags: ["Telecom", "Networking"]
    },
    {
        id: 5,
        supplierId: "#SUP005",
        picture: company6,
        companyName: "Zoetic Fashion",
        contactPerson: "James Price",
        category: "Textiles",
        rating: "4.4",
        location: "Brasilia, Brazil",
        employee: "11-50",
        website: "www.zoeticfashion.com",
        contact: "info@zoeticfashion.com",
        since: "2010",
        status: "Active",
        paymentTerms: "Net 15",
        tags: ["Clothing", "Footwear"]
    },
    {
        id: 6,
        supplierId: "#SUP006",
        picture: dropbox,
        companyName: "Micro Design",
        contactPerson: "Mary Cousar",
        category: "Financial Services",
        rating: "2.7",
        location: "Windhoek, Namibia",
        employee: "11-50",
        website: "www.microdesign.com",
        contact: "info@microdesign.com",
        since: "1997",
        status: "Active",
        paymentTerms: "Net 30",
        tags: ["Finance", "Consulting"]
    },
    {
        id: 7,
        supplierId: "#SUP007",
        picture: mail_chimp,
        companyName: "Syntyce Solutions",
        contactPerson: "Michael Morris",
        category: "Chemical Industry",
        rating: "4.0",
        location: "Damascus, Syria",
        employee: "11-50",
        website: "www.syntycesolutions.com",
        contact: "info@syntycesolutions.com",
        since: "2015",
        status: "Active",
        paymentTerms: "Net 30",
        tags: ["Chemicals", "Research"]
    },
    {
        id: 8,
        supplierId: "#SUP008",
        picture: company3,
        companyName: "Meta4Systems",
        contactPerson: "Nancy Martino",
        category: "IT Equipment",
        rating: "3.3",
        location: "London, UK",
        employee: "51-100",
        website: "www.meta4systems.com",
        contact: "info@meta4systems.com",
        since: "2012",
        status: "Inactive",
        paymentTerms: "Net 45",
        tags: ["Hardware", "Services"]
    },
    {
        id: 9,
        supplierId: "#SUP009",
        picture: company4,
        companyName: "Moetic Fashion",
        contactPerson: "Timothy Smith",
        category: "Textiles",
        rating: "4.9",
        location: "Damascus, Syria",
        employee: "11-50",
        website: "www.moeticfashion.com",
        contact: "info@moeticfashion.com",
        since: "2003",
        status: "Active",
        paymentTerms: "Net 30",
        tags: ["Clothing", "Accessories"]
    },
    {
        id: 10,
        supplierId: "#SUP010",
        picture: slack,
        companyName: "MediCore Solutions",
        contactPerson: "Herbert Stokes",
        category: "Health Services",
        rating: "2.9",
        location: "Berlin, Germany",
        employee: "51-100",
        website: "www.medicoresolutions.com",
        contact: "info@medicoresolutions.com",
        since: "2008",
        status: "Active",
        paymentTerms: "Net 15",
        tags: ["Healthcare", "Equipment"]
    },
];

export { suppliers };
