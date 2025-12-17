import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

// Robust directory finding
function findBlogDir() {
    const candidates = [
        path.join(process.cwd(), 'content/blog'),           // Docker production COPY
        path.join(process.cwd(), '../../../content/blog'),  // Local monorepo
        path.join(process.cwd(), 'public/content/blog'),    // Alternative fallback
    ];

    for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
            console.log(`[Blog] Found blog directory at: ${candidate}`);
            return candidate;
        }
    }

    console.warn(`[Blog] content/blog directory not found. Searched: ${candidates.join(', ')}`);
    return null;
}

const BLOG_DIR = findBlogDir();

export interface BlogPost {
    slug: string;
    category: string;
    title: string;
    description: string;
    date?: string;
    content: string;
    [key: string]: any;
}

export function getAllPosts(): BlogPost[] {
    if (!BLOG_DIR) return [];

    const categories = fs.readdirSync(BLOG_DIR).filter(file =>
        fs.statSync(path.join(BLOG_DIR, file)).isDirectory()
    );

    const posts: BlogPost[] = [];

    for (const category of categories) {
        const categoryPath = path.join(BLOG_DIR, category);
        const files = fs.readdirSync(categoryPath).filter(file => file.endsWith('.md'));

        for (const file of files) {
            const filePath = path.join(categoryPath, file);
            const fileContent = fs.readFileSync(filePath, 'utf8');
            const { data, content } = matter(fileContent);

            // Extract title from content if not in frontmatter
            let title = data.title;
            let description = data.description;

            if (!title) {
                const titleMatch = content.match(/^#\s+(.+)$/m);
                if (titleMatch) {
                    title = titleMatch[1];
                }
            }

            if (!description) {
                const descMatch = content.match(/\*\*Meta Description:\*\*\s*(.+)$/m);
                if (descMatch) {
                    description = descMatch[1];
                }
            }

            posts.push({
                slug: file.replace(/\.md$/, ''),
                category,
                title: title || file.replace(/-/g, ' ').replace('.md', ''),
                description: description || '',
                content,
                ...data,
            });
        }
    }

    return posts;
}

export function getPostsByCategory(category: string): BlogPost[] {
    return getAllPosts().filter(post => post.category === category);
}

export function getPostBySlug(category: string, slug: string): BlogPost | undefined {
    const posts = getAllPosts();
    return posts.find(post => post.category === category && post.slug === slug);
}

export function getCategories(): string[] {
    if (!BLOG_DIR) return [];
    return fs.readdirSync(BLOG_DIR).filter(file =>
        fs.statSync(path.join(BLOG_DIR, file)).isDirectory()
    );
}
