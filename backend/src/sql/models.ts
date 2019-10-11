// THIS FILE WAS AUTOGENERATED BY DEEPWELL v0.0.1
// DO NOT EDIT - MODIFY TEMPLATE INSTEAD

type Nullable<T> = T | null;


export interface PasswordModel {
    user_id: number;

    hash: Buffer;

    salt: Buffer;

    iterations: number;

    digest: number;

}

export interface WikiModel {
    wiki_id: number;

    slug: string;

    name: string;

    created_at: Date;

}

export interface WikiMembershipModel {
    wiki_id: number;

    user_id: number;

    applied_at: Date;

    joined_at: Date;

}

export interface RoleModel {
    role_id: number;

    wiki_id: number;

    name: string;

    permset: number;

}

export interface RoleMembershipModel {
    wiki_id: number;

    role_id: number;

    user_id: number;

    applied_at: Date;

}

export interface PageModel {
    page_id: number;

    created_at?: Date;

    slug: string;

    title: string;

    alt_title: Nullable<string>;

    tags: string[];

}

export interface RevisionModel {
    revision_id: number;

    created_at?: Date;

    page_id: number;

    user_id: number;

    git_commit: string;

    changes: object;

}

export interface UserModel {
    user_id: number;

    name: string;

    created_at?: Date;

    email: string;

    author_page?: string;

    website?: string;

    about?: string;

    location?: string;

    gender?: string;

}

export interface RatingModel {
    page_id: number;

    user_id: number;

    rating: number;

}

export interface RatingsHistoryModel {
    rating_id: number;

    page_id: number;

    user_id: number;

    created_at?: Date;

    rating: Nullable<number>;

}

export interface AuthorModel {
    page_id: number;

    user_id: number;

    author_type: string;

    created_at: Date;

}

export interface ParentModel {
    page_id: number;

    parent_page_id: number;

    parented_by: number;

    parented_at: Date;

}

export interface FileModel {
    file_id: number;

    file_name: string;

    file_uri: string;

    description: string;

    page_id: number;

}


// vim: set ft=jinja:
