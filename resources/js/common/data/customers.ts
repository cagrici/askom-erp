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

// Customers Data
const customers: any = [
    {
        id: 1,
        customerId: "#CUS001",
        picture: dribble,
        companyName: "Acme Corporation",
        contactPerson: "John Doe",
        industry: "Technology",
        rating: "4.8",
        location: "New York, USA",
        employee: "501-1000",
        website: "www.acmecorp.com",
        email: "contact@acmecorp.com",
        since: "2002",
        status: "Active",
        salesValue: "$127,500",
        tags: ["VIP", "Long-term"]
    },
    {
        id: 2,
        customerId: "#CUS002",
        picture: bitbucket,
        companyName: "Beta Solutions",
        contactPerson: "Sarah Jones",
        industry: "Manufacturing",
        rating: "4.2",
        location: "Chicago, USA",
        employee: "101-500",
        website: "www.betasolutions.com",
        email: "info@betasolutions.com",
        since: "2010",
        status: "Active",
        salesValue: "$85,320",
        tags: ["Growth", "B2B"]
    },
    {
        id: 3,
        customerId: "#CUS003",
        picture: company8,
        companyName: "Global Services Ltd",
        contactPerson: "Robert Wilson",
        industry: "Consulting",
        rating: "3.9",
        location: "London, UK",
        employee: "51-100",
        website: "www.globalservices.com",
        email: "sales@globalservices.com",
        since: "2015",
        status: "Active",
        salesValue: "$42,700",
        tags: ["New", "International"]
    },
    {
        id: 4,
        customerId: "#CUS004",
        picture: company1,
        companyName: "Delta Enterprises",
        contactPerson: "Maria Garcia",
        industry: "Retail",
        rating: "4.5",
        location: "Madrid, Spain",
        employee: "101-500",
        website: "www.deltaenterprises.com",
        email: "info@deltaenterprises.com",
        since: "2008",
        status: "Inactive",
        salesValue: "$245,850",
        tags: ["Retail", "VIP"]
    },
    {
        id: 5,
        customerId: "#CUS005",
        picture: company6,
        companyName: "Echo Industries",
        contactPerson: "David Kim",
        industry: "Automotive",
        rating: "3.7",
        location: "Seoul, South Korea",
        employee: "1001-5000",
        website: "www.echoindustries.com",
        email: "contact@echoindustries.com",
        since: "2000",
        status: "Active",
        salesValue: "$347,250",
        tags: ["Manufacturing", "International"]
    },
    {
        id: 6,
        customerId: "#CUS006",
        picture: dropbox,
        companyName: "Foxtrot Media",
        contactPerson: "Jessica Brown",
        industry: "Media & Entertainment",
        rating: "4.9",
        location: "Los Angeles, USA",
        employee: "11-50",
        website: "www.foxtrotmedia.com",
        email: "info@foxtrotmedia.com",
        since: "2018",
        status: "Active",
        salesValue: "$78,400",
        tags: ["Media", "Growing"]
    },
    {
        id: 7,
        customerId: "#CUS007",
        picture: mail_chimp,
        companyName: "Golf Hospitality",
        contactPerson: "Thomas Miller",
        industry: "Hospitality",
        rating: "4.3",
        location: "Sydney, Australia",
        employee: "101-500",
        website: "www.golfhospitality.com",
        email: "info@golfhospitality.com",
        since: "2012",
        status: "Active",
        salesValue: "$154,730",
        tags: ["Services", "International"]
    },
    {
        id: 8,
        customerId: "#CUS008",
        picture: company3,
        companyName: "Hotel Chain Group",
        contactPerson: "Laura White",
        industry: "Hospitality",