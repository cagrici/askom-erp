import BreadCrumb from '../../../../Components/Common/BreadCrumb'
import React from 'react'
import { Container, Row } from 'react-bootstrap'
import Sidepanel from './Sidepanel'
import MainList from './MainList'
import Layout from '../../../../Layouts'
import { PageProps } from '@inertiajs/core'

interface Post {
    id: number;
    title: string;
    slug: string;
    summary: string;
    content: string;
    category: { id: number; name: string; slug: string; };
    author: { id: number; name: string; };
    featured_image_path: string;
    publish_at: string;
    status: string;
    allow_comments: boolean;
    is_featured: boolean;
    created_at: string;
    updated_at: string;
    tags: Array<{
        id: number;
        name: string;
        slug: string;
    }>;
}

interface Category {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    color: string | null;
    icon: string | null;
    is_active: boolean;
}

interface Tag {
    id: number;
    name: string;
    slug: string;
}

interface BlogListProps {
    posts: {
        data: Post[];
        current_page: number;
        per_page: number;
        total: number;
    };
    categories: Category[];
    tags: Tag[];
    filters: {
        status: string;
        category: number | null;
        search: string | null;
    };
}

const BlogListView = ({ posts, categories, tags, filters }: PageProps<BlogListProps>) => {

    document.title="Haberler | Şirket İçi Portal";

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Haberler" pageTitle="İntranet" />
                    <Row>
                        <Sidepanel categories={categories} tags={tags} />
                        <MainList 
                            posts={posts} 
                            filters={filters} 
                        />
                    </Row>
                </Container>
            </div>
        </React.Fragment>
    )
}

BlogListView.layout = (page:any) => <Layout children={page} />
export default BlogListView