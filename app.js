'use strict';

// ---- State ----
let posts = JSON.parse(localStorage.getItem('imageBlogPosts') || '[]');
let pendingImages = []; // { dataUrl, name }
let pendingTags = [];
let activeFilterTags = new Set();
let searchQuery = '';

// ---- DOM refs ----
const imageUpload     = document.getElementById('image-upload');
const imagePreviews   = document.getElementById('image-previews');
const postTitle       = document.getElementById('post-title');
const postDescription = document.getElementById('post-description');
const tagInput        = document.getElementById('tag-input');
const tagList         = document.getElementById('tag-list');
const submitBtn       = document.getElementById('submit-btn');
const searchInput     = document.getElementById('search-input');
const clearSearch     = document.getElementById('clear-search');
const allTagsFilter   = document.getElementById('all-tags-filter');
const postsContainer  = document.getElementById('posts-container');
const emptyState      = document.getElementById('empty-state');
const modal           = document.getElementById('modal');
const modalBackdrop   = document.getElementById('modal-backdrop');
const modalClose      = document.getElementById('modal-close');
const modalImage      = document.getElementById('modal-image');
const modalTitle      = document.getElementById('modal-title');
const modalDate       = document.getElementById('modal-date');
const modalDescription = document.getElementById('modal-description');
const modalTags       = document.getElementById('modal-tags');

// ---- Helpers ----
function savePosts() {
  localStorage.setItem('imageBlogPosts', JSON.stringify(posts));
}

function formatDate(isoStr) {
  const d = new Date(isoStr);
  return d.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function getAllTags() {
  const set = new Set();
  posts.forEach(p => p.tags.forEach(t => set.add(t)));
  return [...set].sort();
}

// ---- Image upload ----
imageUpload.addEventListener('change', (e) => {
  const files = Array.from(e.target.files);
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      pendingImages.push({ dataUrl: ev.target.result, name: file.name });
      renderPreviews();
    };
    reader.readAsDataURL(file);
  });
  imageUpload.value = '';
});

function renderPreviews() {
  imagePreviews.innerHTML = '';
  pendingImages.forEach((img, idx) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'preview-wrapper';

    const el = document.createElement('img');
    el.src = img.dataUrl;
    el.alt = img.name;

    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-preview';
    removeBtn.textContent = '×';
    removeBtn.addEventListener('click', () => {
      pendingImages.splice(idx, 1);
      renderPreviews();
    });

    wrapper.appendChild(el);
    wrapper.appendChild(removeBtn);
    imagePreviews.appendChild(wrapper);
  });
}

// ---- Tag input ----
tagInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault();
    addPendingTag(tagInput.value.trim());
    tagInput.value = '';
  }
});

tagInput.addEventListener('blur', () => {
  if (tagInput.value.trim()) {
    addPendingTag(tagInput.value.trim());
    tagInput.value = '';
  }
});

function addPendingTag(text) {
  if (!text || pendingTags.includes(text)) return;
  pendingTags.push(text);
  renderPendingTags();
}

function renderPendingTags() {
  tagList.innerHTML = '';
  pendingTags.forEach((tag, idx) => {
    const el = createTagElement(tag, () => {
      pendingTags.splice(idx, 1);
      renderPendingTags();
    });
    tagList.appendChild(el);
  });
}

function createTagElement(text, onRemove) {
  const el = document.createElement('span');
  el.className = 'tag';
  el.textContent = text;
  if (onRemove) {
    const btn = document.createElement('span');
    btn.className = 'tag-remove';
    btn.textContent = '×';
    btn.addEventListener('click', (e) => { e.stopPropagation(); onRemove(); });
    el.appendChild(btn);
  }
  return el;
}

// ---- Submit ----
submitBtn.addEventListener('click', () => {
  const title = postTitle.value.trim();
  if (!title && pendingImages.length === 0) {
    alert('タイトルまたは画像を入力してください。');
    return;
  }

  const post = {
    id: Date.now().toString(),
    title: title || '無題',
    description: postDescription.value.trim(),
    images: [...pendingImages],
    tags: [...pendingTags],
    createdAt: new Date().toISOString(),
  };

  posts.unshift(post);
  savePosts();

  // Reset form
  postTitle.value = '';
  postDescription.value = '';
  tagInput.value = '';
  pendingImages = [];
  pendingTags = [];
  renderPreviews();
  renderPendingTags();

  renderAll();
});

// ---- Search ----
searchInput.addEventListener('input', () => {
  searchQuery = searchInput.value.trim().toLowerCase();
  renderPosts();
});

clearSearch.addEventListener('click', () => {
  searchInput.value = '';
  searchQuery = '';
  activeFilterTags.clear();
  renderAll();
});

// ---- Filter tags ----
function renderFilterTags() {
  allTagsFilter.innerHTML = '';
  const tags = getAllTags();
  if (tags.length === 0) {
    allTagsFilter.innerHTML = '<span style="font-size:0.8rem;color:#ccc;">タグなし</span>';
    return;
  }
  tags.forEach(tag => {
    const el = document.createElement('span');
    el.className = 'tag' + (activeFilterTags.has(tag) ? ' active' : '');
    el.textContent = tag;
    el.addEventListener('click', () => {
      if (activeFilterTags.has(tag)) {
        activeFilterTags.delete(tag);
      } else {
        activeFilterTags.add(tag);
      }
      renderFilterTags();
      renderPosts();
    });
    allTagsFilter.appendChild(el);
  });
}

// ---- Render posts ----
function getFilteredPosts() {
  return posts.filter(post => {
    const matchesSearch = !searchQuery || (
      post.title.toLowerCase().includes(searchQuery) ||
      post.description.toLowerCase().includes(searchQuery) ||
      post.tags.some(t => t.toLowerCase().includes(searchQuery))
    );
    const matchesTags = activeFilterTags.size === 0 ||
      [...activeFilterTags].every(t => post.tags.includes(t));
    return matchesSearch && matchesTags;
  });
}

function renderPosts() {
  const filtered = getFilteredPosts();
  postsContainer.innerHTML = '';

  if (filtered.length === 0) {
    emptyState.style.display = 'block';
    return;
  }
  emptyState.style.display = 'none';

  filtered.forEach(post => {
    const card = document.createElement('div');
    card.className = 'post-card';

    // Image area
    const imageArea = document.createElement('div');
    imageArea.className = 'multi-image';
    if (post.images && post.images.length > 0) {
      const img = document.createElement('img');
      img.className = 'card-image';
      img.src = post.images[0].dataUrl;
      img.alt = post.title;
      img.addEventListener('click', () => openModal(post));
      imageArea.appendChild(img);
      if (post.images.length > 1) {
        const badge = document.createElement('span');
        badge.className = 'image-count-badge';
        badge.textContent = `+${post.images.length - 1}枚`;
        imageArea.appendChild(badge);
      }
    } else {
      const placeholder = document.createElement('div');
      placeholder.className = 'card-image-placeholder';
      placeholder.textContent = '🖼';
      imageArea.appendChild(placeholder);
    }
    card.appendChild(imageArea);

    // Body
    const body = document.createElement('div');
    body.className = 'card-body';

    const titleEl = document.createElement('div');
    titleEl.className = 'card-title';
    titleEl.textContent = post.title;
    body.appendChild(titleEl);

    const dateEl = document.createElement('div');
    dateEl.className = 'card-date';
    dateEl.textContent = formatDate(post.createdAt);
    body.appendChild(dateEl);

    if (post.description) {
      const desc = document.createElement('div');
      desc.className = 'card-description';
      desc.textContent = post.description;
      body.appendChild(desc);
    }

    const footer = document.createElement('div');
    footer.className = 'card-footer';

    const tagsWrapper = document.createElement('div');
    tagsWrapper.className = 'tag-list';
    post.tags.forEach(tag => {
      const el = document.createElement('span');
      el.className = 'tag';
      el.textContent = tag;
      el.addEventListener('click', () => {
        activeFilterTags.add(tag);
        renderFilterTags();
        renderPosts();
      });
      tagsWrapper.appendChild(el);
    });
    footer.appendChild(tagsWrapper);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-danger';
    deleteBtn.textContent = '削除';
    deleteBtn.addEventListener('click', () => {
      if (confirm(`「${post.title}」を削除しますか？`)) {
        posts = posts.filter(p => p.id !== post.id);
        savePosts();
        renderAll();
      }
    });
    footer.appendChild(deleteBtn);

    body.appendChild(footer);
    card.appendChild(body);
    postsContainer.appendChild(card);
  });
}

function renderAll() {
  renderFilterTags();
  renderPosts();
}

// ---- Modal ----
let currentModalPost = null;
let currentModalImageIdx = 0;

function openModal(post) {
  currentModalPost = post;
  currentModalImageIdx = 0;
  updateModalImage();

  modalTitle.textContent = post.title;
  modalDate.textContent = formatDate(post.createdAt);
  modalDescription.textContent = post.description || '';

  modalTags.innerHTML = '';
  post.tags.forEach(tag => {
    const el = document.createElement('span');
    el.className = 'tag';
    el.textContent = tag;
    modalTags.appendChild(el);
  });

  // Multi-image thumbnails
  let thumbsRow = document.getElementById('modal-thumbs');
  if (thumbsRow) thumbsRow.remove();

  if (post.images && post.images.length > 1) {
    thumbsRow = document.createElement('div');
    thumbsRow.id = 'modal-thumbs';
    thumbsRow.className = 'modal-images';
    post.images.forEach((img, idx) => {
      const thumb = document.createElement('img');
      thumb.src = img.dataUrl;
      thumb.alt = img.name;
      thumb.className = idx === 0 ? 'selected' : '';
      thumb.addEventListener('click', () => {
        currentModalImageIdx = idx;
        updateModalImage();
        thumbsRow.querySelectorAll('img').forEach((t, i) => {
          t.className = i === idx ? 'selected' : '';
        });
      });
      thumbsRow.appendChild(thumb);
    });
    modalImage.after(thumbsRow);
  }

  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function updateModalImage() {
  if (currentModalPost && currentModalPost.images && currentModalPost.images.length > 0) {
    modalImage.src = currentModalPost.images[currentModalImageIdx].dataUrl;
    modalImage.alt = currentModalPost.title;
  } else {
    modalImage.src = '';
  }
}

function closeModal() {
  modal.style.display = 'none';
  document.body.style.overflow = '';
  currentModalPost = null;
}

modalClose.addEventListener('click', closeModal);
modalBackdrop.addEventListener('click', closeModal);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

// ---- Init ----
renderAll();
