import { IPost } from '../models/Post';
import { Types } from 'mongoose';
export declare class PostService {
    /**
     * Creates a new post. Uploads the image to Cloudinary, parses tags, and saves the document in MongoDB.
     *
     * @param userId The creator's user ID
     * @param fileBuffer Buffer of the uploaded file
     * @param caption Optional caption text
     * @param tags Comma-separated string or array of tags
     */
    static createPost(userId: string | Types.ObjectId, fileBuffer: Buffer, caption?: string, tags?: string | string[]): Promise<IPost>;
    /**
     * Fetches posts based on filters with pagination, sorting, search queries, and optional current-user contextual likes/bookmarks status.
     */
    static getPosts(options: {
        page: number;
        limit: number;
        searchQuery?: string;
        tagQuery?: string;
        currentUser?: any;
    }): Promise<{
        posts: {
            isLiked: boolean;
            isBookmarked: any;
            likesCount: number;
            user: Types.ObjectId;
            imageUrl: string;
            cloudinaryId: string;
            caption: string;
            tags: string[];
            likes: Types.ObjectId[];
            commentsCount: number;
            createdAt: Date;
            updatedAt: Date;
            _id: Types.ObjectId;
            $locals: Record<string, unknown>;
            $op: "save" | "validate" | "remove" | null;
            $where: Record<string, unknown>;
            baseModelName?: string;
            collection: import("mongoose").Collection;
            db: import("mongoose").Connection;
            errors?: import("mongoose").Error.ValidationError;
            id?: any;
            isNew: boolean;
            schema: import("mongoose").Schema;
            __v: number;
        }[];
        pagination: {
            page: number;
            limit: number;
            totalPages: number;
            totalPosts: number;
            hasMore: boolean;
        };
    }>;
    /**
     * Posts from creators the current user follows (home / following feed).
     */
    static getFollowingFeed(options: {
        page: number;
        limit: number;
        currentUser: {
            _id: Types.ObjectId;
            bookmarks: Types.ObjectId[];
            following: Types.ObjectId[];
        };
    }): Promise<{
        posts: {
            isLiked: boolean;
            isBookmarked: boolean;
            likesCount: number;
            user: Types.ObjectId;
            imageUrl: string;
            cloudinaryId: string;
            caption: string;
            tags: string[];
            likes: Types.ObjectId[];
            commentsCount: number;
            createdAt: Date;
            updatedAt: Date;
            _id: Types.ObjectId;
            $locals: Record<string, unknown>;
            $op: "save" | "validate" | "remove" | null;
            $where: Record<string, unknown>;
            baseModelName?: string;
            collection: import("mongoose").Collection;
            db: import("mongoose").Connection;
            errors?: import("mongoose").Error.ValidationError;
            id?: any;
            isNew: boolean;
            schema: import("mongoose").Schema;
            __v: number;
        }[];
        pagination: {
            page: number;
            limit: number;
            totalPages: number;
            totalPosts: number;
            hasMore: boolean;
        };
    }>;
    /**
     * Fetches a single post by ID with optional current-user contextual statuses.
     */
    static getPostById(postId: string, currentUser?: any): Promise<{
        isLiked: boolean;
        isBookmarked: any;
        likesCount: number;
        user: Types.ObjectId;
        imageUrl: string;
        cloudinaryId: string;
        caption: string;
        tags: string[];
        likes: Types.ObjectId[];
        commentsCount: number;
        createdAt: Date;
        updatedAt: Date;
        _id: Types.ObjectId;
        $locals: Record<string, unknown>;
        $op: "save" | "validate" | "remove" | null;
        $where: Record<string, unknown>;
        baseModelName?: string;
        collection: import("mongoose").Collection;
        db: import("mongoose").Connection;
        errors?: import("mongoose").Error.ValidationError;
        id?: any;
        isNew: boolean;
        schema: import("mongoose").Schema;
        __v: number;
    }>;
    /**
     * Deletes a post, deletes its media from Cloudinary, and cleans up all related comments, notifications, and bookmarks.
     */
    static deletePost(postId: string, userId: string): Promise<void>;
    /**
     * Adds a like to the post. Creates a notification if the liker is not the post owner.
     */
    static likePost(postId: string, currentUserId: string): Promise<number>;
    /**
     * Removes a like from the post and deletes the associated notification.
     */
    static unlikePost(postId: string, currentUserId: string): Promise<number>;
    /**
     * Bookmarks a post for the user.
     */
    static bookmarkPost(postId: string, userId: string): Promise<void>;
    /**
     * Unbookmarks a post for the user.
     */
    static unbookmarkPost(postId: string, userId: string): Promise<void>;
    private static formatPostsForUser;
    static getPostsByUser(userId: string, currentUser?: any): Promise<any[]>;
    static getSavedPosts(userId: string, currentUser?: any): Promise<any[]>;
    static getLikedPosts(userId: string, currentUser?: any): Promise<any[]>;
}
