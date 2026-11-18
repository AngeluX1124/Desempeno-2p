import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PostsApiService, Post } from '../../services/posts-api';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-posts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './posts.html',
  styleUrls: ['./posts.css']
})
export class PostsComponent implements OnInit {
  posts: Post[] = [];
  newPost: Post = { title: '', body: '' };
  
  editingPostId: number | null = null;
  editedPost: Post = { title: '', body: '' };

  loading = false;
  submitting = false;
  errorMessage = '';
  successMessage = '';
  currentUser = '';

  constructor(
    private postsApi: PostsApiService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.currentUser = localStorage.getItem('username') || 'Usuario';
    this.loadPosts();
  }

  loadPosts(): void {
    this.loading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    // Siempre carga directo de la API o respaldo, sin persistencia en localStorage al recargar
    this.postsApi.getPosts().subscribe({
      next: (data) => {
        this.posts = data ? data.slice(0, 15).reverse() : [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.posts = [
          { id: 3, userId: 1, title: '🚀 Publicación de prueba 3', body: 'Contenido predeterminado de respaldo.' },
          { id: 2, userId: 1, title: '💡 Publicación de prueba 2', body: 'Sistema funcionando correctamente.' },
          { id: 1, userId: 1, title: '✨ Bienvenidos al muro', body: 'Práctica de desarrollo web en Angular.' }
        ];
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  createPost(): void {
    if (!this.newPost.title.trim() || !this.newPost.body.trim()) {
      this.errorMessage = 'El título y el contenido no pueden estar vacíos.';
      this.cdr.detectChanges();
      return;
    }

    this.submitting = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    this.postsApi.createPost({
      title: this.newPost.title,
      body: this.newPost.body,
      userId: 1
    }).subscribe({
      next: (created) => {
        const uniqueId = created.id || Date.now();
        const postToAdd: Post = {
          id: uniqueId,
          userId: 1,
          title: this.newPost.title,
          body: this.newPost.body
        };
        
        this.posts.unshift(postToAdd); // Se muestra en pantalla al instante
        this.newPost = { title: '', body: '' };
        this.submitting = false;
        this.successMessage = '¡Publicación creada exitosamente!';
        this.cdr.detectChanges();
        
        setTimeout(() => {
          this.successMessage = '';
          this.cdr.detectChanges();
        }, 3000);
      },
      error: () => {
        const postToAdd: Post = {
          id: Date.now(),
          userId: 1,
          title: this.newPost.title,
          body: this.newPost.body
        };
        this.posts.unshift(postToAdd);
        this.newPost = { title: '', body: '' };
        this.submitting = false;
        this.successMessage = '¡Publicación creada localmente!';
        this.cdr.detectChanges();
        
        setTimeout(() => {
          this.successMessage = '';
          this.cdr.detectChanges();
        }, 3000);
      }
    });
  }

  startEdit(post: Post): void {
    if (post.id) {
      this.editingPostId = post.id;
      this.editedPost = { title: post.title, body: post.body };
      this.cdr.detectChanges();
    }
  }

  cancelEdit(): void {
    this.editingPostId = null;
    this.editedPost = { title: '', body: '' };
    this.cdr.detectChanges();
  }

  updatePost(id: number): void {
    if (!this.editedPost.title.trim() || !this.editedPost.body.trim()) return;

    this.postsApi.updatePost(id, {
      id,
      title: this.editedPost.title,
      body: this.editedPost.body,
      userId: 1
    }).subscribe({
      next: () => {
        const index = this.posts.findIndex(p => p.id === id);
        if (index !== -1) {
          this.posts[index] = { ...this.posts[index], ...this.editedPost };
        }
        this.editingPostId = null;
        this.successMessage = '¡Actualizado con éxito!';
        this.cdr.detectChanges();
        
        setTimeout(() => {
          this.successMessage = '';
          this.cdr.detectChanges();
        }, 3000);
      },
      error: () => {
        const index = this.posts.findIndex(p => p.id === id);
        if (index !== -1) {
          this.posts[index] = { ...this.posts[index], ...this.editedPost };
        }
        this.editingPostId = null;
        this.successMessage = '¡Actualizado localmente!';
        this.cdr.detectChanges();
        
        setTimeout(() => {
          this.successMessage = '';
          this.cdr.detectChanges();
        }, 3000);
      }
    });
  }

  deletePost(id?: number): void {
    if (!id) return;
    if (confirm('¿Estás seguro de eliminar esta publicación?')) {
      this.postsApi.deletePost(id).subscribe({
        next: () => {
          this.posts = this.posts.filter(p => p.id !== id);
          this.cdr.detectChanges();
        },
        error: () => {
          this.posts = this.posts.filter(p => p.id !== id);
          this.cdr.detectChanges();
        }
      });
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}