@extends('layouts.app')

@section('content')
<div class="container">
    <div class="row justify-content-center">
        <div class="col-md-12">
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <span>{{ __('Edit Document') }}</span>
                    <a href="{{ route('documents.index') }}" class="btn btn-secondary btn-sm">{{ __('Back to Documents') }}</a>
                </div>

                <div class="card-body">
                    @if ($errors->any())
                        <div class="alert alert-danger">
                            <ul class="mb-0">
                                @foreach ($errors->all() as $error)
                                    <li>{{ $error }}</li>
                                @endforeach
                            </ul>
                        </div>
                    @endif

                    <form method="POST" action="{{ route('documents.update', $document) }}" enctype="multipart/form-data">
                        @csrf
                        @method('PUT')

                        <div class="form-group row mb-3">
                            <label for="title" class="col-md-2 col-form-label text-md-right">{{ __('Title') }}</label>
                            <div class="col-md-10">
                                <input id="title" type="text" class="form-control @error('title') is-invalid @enderror" name="title" value="{{ old('title', $document->title) }}" required autocomplete="title" autofocus>
                                @error('title')
                                    <span class="invalid-feedback" role="alert">
                                        <strong>{{ $message }}</strong>
                                    </span>
                                @enderror
                            </div>
                        </div>

                        <div class="form-group row mb-3">
                            <label for="document_category_id" class="col-md-2 col-form-label text-md-right">{{ __('Category') }}</label>
                            <div class="col-md-10">
                                <select id="document_category_id" class="form-control @error('document_category_id') is-invalid @enderror" name="document_category_id" required>
                                    <option value="">{{ __('Select a category') }}</option>
                                    @foreach ($categories as $category)
                                        <option value="{{ $category->id }}" {{ (old('document_category_id', $document->document_category_id) == $category->id) ? 'selected' : '' }}>
                                            {{ $category->name }}
                                        </option>
                                    @endforeach
                                </select>
                                @error('document_category_id')
                                    <span class="invalid-feedback" role="alert">
                                        <strong>{{ $message }}</strong>
                                    </span>
                                @enderror
                            </div>
                        </div>

                        <div class="form-group row mb-3">
                            <label for="tags" class="col-md-2 col-form-label text-md-right">{{ __('Tags') }}</label>
                            <div class="col-md-10">
                                <select id="tags" class="form-control @error('tags') is-invalid @enderror" name="tags[]" multiple>
                                    @foreach ($tags as $tag)
                                        <option value="{{ $tag->id }}" {{ (is_array(old('tags', $document->tags->pluck('id')->toArray())) && in_array($tag->id, old('tags', $document->tags->pluck('id')->toArray()))) ? 'selected' : '' }}>
                                            {{ $tag->name }}
                                        </option>
                                    @endforeach
                                </select>
                                <small class="form-text text-muted">{{ __('Hold Ctrl (Windows) or Command (Mac) to select multiple tags.') }}</small>
                                @error('tags')
                                    <span class="invalid-feedback" role="alert">
                                        <strong>{{ $message }}</strong>
                                    </span>
                                @enderror
                            </div>
                        </div>

                        <div class="form-group row mb-3">
                            <label for="content" class="col-md-2 col-form-label text-md-right">{{ __('Content') }}</label>
                            <div class="col-md-10">
                                <textarea id="content" class="form-control @error('content') is-invalid @enderror" name="content" rows="6" required>{{ old('content', $document->content) }}</textarea>
                                @error('content')
                                    <span class="invalid-feedback" role="alert">
                                        <strong>{{ $message }}</strong>
                                    </span>
                                @enderror
                            </div>
                        </div>

                        <div class="form-group row mb-3">
                            <label for="file" class="col-md-2 col-form-label text-md-right">{{ __('Attachment') }}</label>
                            <div class="col-md-10">
                                <input id="file" type="file" class="form-control @error('file') is-invalid @enderror" name="file">
                                <small class="form-text text-muted">{{ __('Max file size: 10MB. Leave empty to keep the current file.') }}</small>
                                
                                @if($document->file_path)
                                    <div class="mt-2">
                                        <span class="text-muted">{{ __('Current file:') }}</span>
                                        <a href="{{ route('documents.download', $document) }}">{{ basename($document->file_path) }}</a>
                                    </div>
                                @endif
                                
                                @error('file')
                                    <span class="invalid-feedback" role="alert">
                                        <strong>{{ $message }}</strong>
                                    </span>
                                @enderror
                            </div>
                        </div>

                        <div class="form-group row mb-0">
                            <div class="col-md-10 offset-md-2">
                                <button type="submit" class="btn btn-primary">
                                    {{ __('Update Document') }}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection

@section('scripts')
<script>
    // You can add JavaScript for rich text editor integration here
    // For example, CKEditor, TinyMCE, etc.
</script>
@endsection
