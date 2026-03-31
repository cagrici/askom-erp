import BreadCrumb from '../../../../Components/Common/BreadCrumb';
import React from 'react'
import { Container } from 'react-bootstrap';
import SimpleBar from 'simplebar-react';
import { Link } from '@inertiajs/react';
import Layout from '../../../../Layouts';
import { PageProps } from '@inertiajs/core';

interface PostComment {
    id: number;
    user: {
        id: number;
        name: string;
        avatar?: string;
    };
    content: string;
    created_at: string;
    replies?: PostComment[];
}

interface Post {
    id: number;
    title: string;
    slug: string;
    summary: string;
    content: string;
    category: { 
        id: number; 
        name: string; 
        slug: string;
        color?: string;
    };
    author: { 
        id: number; 
        name: string;
        avatar?: string;
        position?: string;
    };
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
    comments: PostComment[];
}

interface BlogOverviewProps {
    post: Post;
    similarPosts: Post[];
}

const PageBlogOverview = ({ post, similarPosts }: PageProps<BlogOverviewProps>) => {
    document.title = `${post.title} | Şirket İçi Portal`;
    
    // Form state
    const [commentName, setCommentName] = React.useState('');
    const [commentContent, setCommentContent] = React.useState('');

    // Tarih formatı düzenleme
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('tr-TR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    // Yorum ekleme
    const handleAddComment = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Form doğrulama
        if (!commentContent.trim()) {
            alert('Lütfen bir yorum girin.');
            return;
        }
        
        // Yorum gönderme işlemi
        // İstek göndermek için form içerisinde hidden form ile CSRF token gönderilmeli
        const form = e.target as HTMLFormElement;
        form.submit();
    };

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title={post.title} pageTitle="Haberler" />

                    <div className="row justify-content-center">
                        <div className="col-xxl-10">
                            <div className="card">
                                <div className="card-body">
                                    <div className="text-center mb-4">
                                        {post.category && (
                                            <p className="text-success text-uppercase mb-2">{post.category.name}</p>
                                        )}
                                        <h4 className="mb-2">{post.title}</h4>
                                        {post.summary && (
                                            <p className="text-muted mb-4">{post.summary}</p>
                                        )}
                                        {post.tags && post.tags.length > 0 && (
                                            <div className="d-flex align-items-center justify-content-center flex-wrap gap-2">
                                                {post.tags.map((tag) => (
                                                    <span key={tag.id} className="badge bg-primary-subtle text-primary">{tag.name}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    
                                    {post.featured_image_path ? (
                                        <img 
                                            src={`/storage/${post.featured_image_path}`} 
                                            alt={post.title} 
                                            className="img-thumbnail"
                                        />
                                    ) : (
                                        <div className="bg-light d-flex align-items-center justify-content-center p-5 rounded mb-4">
                                            <i className="ri-image-line display-1 text-muted"></i>
                                        </div>
                                    )}

                                    <div className="row mt-4">
                                        <div className="col-lg-3">
                                            <h6 className="pb-1">Yazar:</h6>
                                            <div className="d-flex gap-2 mb-3">
                                                <div className="flex-shrink-0">
                                                    {post.author.avatar ? (
                                                        <img 
                                                            src={`/storage/${post.author.avatar}`} 
                                                            alt={post.author.name} 
                                                            className="avatar-sm rounded" 
                                                        />
                                                    ) : (
                                                        <div className="avatar-sm rounded bg-primary">
                                                            <span className="avatar-title text-white">
                                                                {post.author.name.charAt(0)}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-grow-1">
                                                    <h5 className="mb-1">
                                                        <Link href={`/profile/${post.author.id}`}>{post.author.name}</Link>
                                                    </h5>
                                                    {post.author.position && (
                                                        <p className="mb-2">{post.author.position}</p>
                                                    )}
                                                    <p className="text-muted mb-0">{formatDate(post.publish_at)}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-lg-9">
                                            <div className="content" dangerouslySetInnerHTML={{ __html: post.content }} />
                                            
                                            {similarPosts && similarPosts.length > 0 && (
                                                <div className="mt-4">
                                                    <h5 className="mb-3">Benzer Haberler</h5>
                                                    <div className="row">
                                                        {similarPosts.map((relatedPost) => (
                                                            <div className="col-md-4" key={relatedPost.id}>
                                                                <div className="card mb-3">
                                                                    {relatedPost.featured_image_path ? (
                                                                        <img 
                                                                            src={`/storage/${relatedPost.featured_image_path}`} 
                                                                            className="card-img-top" 
                                                                            alt={relatedPost.title} 
                                                                        />
                                                                    ) : (
                                                                        <div className="card-img-top bg-light d-flex align-items-center justify-content-center" style={{ height: "120px" }}>
                                                                            <i className="ri-image-line text-muted fs-3"></i>
                                                                        </div>
                                                                    )}
                                                                    <div className="card-body">
                                                                        <h5 className="card-title fs-15">
                                                                            <Link href={route('news.show', relatedPost.id)}>
                                                                                {relatedPost.title}
                                                                            </Link>
                                                                        </h5>
                                                                        <p className="card-text text-muted small">
                                                                            {formatDate(relatedPost.publish_at)}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {post.allow_comments && (
                                                <div>
                                                    <h5 className="fw-semibold mb-3">Yorumlar:</h5>
                                                    <SimpleBar style={{height: "300px"}} className="px-3 mx-n3 mb-2">
                                                        {post.comments && post.comments.length > 0 ? (
                                                            post.comments.map((comment) => (
                                                                <div className="d-flex mb-4" key={comment.id}>
                                                                    <div className="flex-shrink-0">
                                                                        {comment.user.avatar ? (
                                                                            <img 
                                                                                src={`/storage/${comment.user.avatar}`} 
                                                                                alt={comment.user.name} 
                                                                                className="avatar-xs rounded-circle" 
                                                                            />
                                                                        ) : (
                                                                            <div className="avatar-xs">
                                                                                <span className="avatar-title rounded-circle bg-info text-white">
                                                                                    {comment.user.name.charAt(0)}
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex-grow-1 ms-3">
                                                                        <h5 className="fs-13">
                                                                            {comment.user.name} 
                                                                            <small className="text-muted ms-2">
                                                                                {formatDate(comment.created_at)}
                                                                            </small>
                                                                        </h5>
                                                                        <p className="text-muted">{comment.content}</p>
                                                                        <Link href="#" className="badge text-muted bg-light">
                                                                            <i className="mdi mdi-reply"></i> Yanıtla
                                                                        </Link>
                                                                        
                                                                        {comment.replies && comment.replies.length > 0 && (
                                                                            comment.replies.map((reply) => (
                                                                                <div className="d-flex mt-4" key={reply.id}>
                                                                                    <div className="flex-shrink-0">
                                                                                        {reply.user.avatar ? (
                                                                                            <img 
                                                                                                src={`/storage/${reply.user.avatar}`} 
                                                                                                alt={reply.user.name} 
                                                                                                className="avatar-xs rounded-circle" 
                                                                                            />
                                                                                        ) : (
                                                                                            <div className="avatar-xs">
                                                                                                <span className="avatar-title rounded-circle bg-info text-white">
                                                                                                    {reply.user.name.charAt(0)}
                                                                                                </span>
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                    <div className="flex-grow-1 ms-3">
                                                                                        <h5 className="fs-13">
                                                                                            {reply.user.name}
                                                                                            <small className="text-muted ms-2">
                                                                                                {formatDate(reply.created_at)}
                                                                                            </small>
                                                                                        </h5>
                                                                                        <p className="text-muted">{reply.content}</p>
                                                                                        <Link href="#" className="badge text-muted bg-light">
                                                                                            <i className="mdi mdi-reply"></i> Yanıtla
                                                                                        </Link>
                                                                                    </div>
                                                                                </div>
                                                                            ))
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="text-center p-4">
                                                                <div className="avatar-md mx-auto mb-4">
                                                                    <div className="avatar-title bg-light rounded-circle text-primary display-6">
                                                                        <i className="ri-chat-3-line"></i>
                                                                    </div>
                                                                </div>
                                                                <h5>Henüz yorum yapılmamış</h5>
                                                                <p className="text-muted">İlk yorumu siz yapın!</p>
                                                            </div>
                                                        )}
                                                    </SimpleBar>
                                                    <form className="mt-4" onSubmit={handleAddComment} method="POST" action={route('news.comments.add', post.id)}>
                                                        <div className="row g-3">
                                                            <div className="col-12">
                                                                <label htmlFor="exampleFormControlTextarea1" className="form-label text-body">Yorum Yazın</label>
                                                                <textarea 
                                                                    className="form-control bg-light border-light" 
                                                                    id="exampleFormControlTextarea1" 
                                                                    rows={3} 
                                                                    placeholder="Yorumunuzu buraya yazınız..." 
                                                                    required
                                                                    value={commentContent}
                                                                    onChange={(e) => setCommentContent(e.target.value)}
                                                                ></textarea>
                                                            </div>
                                                            <div className="col-12 text-end">
                                                                <button type="button" className="btn btn-ghost-secondary btn-icon waves-effect me-1"><i className="ri-attachment-line fs-16"></i></button>
                                                                <button type="submit" className="btn btn-success">Yorum Gönder</button>
                                                            </div>
                                                        </div>
                                                    </form>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Container>
            </div>
        </React.Fragment>
    )
}

PageBlogOverview.layout = (page:any) => <Layout children={page} />
export default PageBlogOverview