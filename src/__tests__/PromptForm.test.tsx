import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PromptForm } from '@/components/Prompt/PromptForm';

describe('PromptForm Component', () => {

  const mockFolders = [
    { id: 'folder1', name: 'Work', userId: 'user1', createdAt: Date.now() },
    { id: 'folder2', name: 'Personal', userId: 'user1', createdAt: Date.now() },
  ];

  it('should not render anything if isOpen is false', () => {
    const { container } = render(
      <PromptForm
        isOpen={false}
        onClose={vi.fn()}
        onSave={vi.fn()}
        folders={mockFolders}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render form fields when isOpen is true', () => {
    render(
      <PromptForm
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
        folders={mockFolders}
      />
    );

    // Check if main elements exist
    expect(screen.getByText('Yeni Prompt Oluştur')).toBeTruthy();
    expect(screen.getByPlaceholderText('Örn: Gen AI Promptu')).toBeTruthy();
    expect(screen.getByText('Prompt İçeriği')).toBeTruthy();
    expect(screen.getByText('Oluştur')).toBeTruthy();
  });

  it('should prepopulate fields if initialData is provided', () => {
    const initialData: any = {
      title: 'Existing Prompt',
      content: 'Some saved content',
      folderId: 'folder2',
      isPublic: true
    };

    render(
      <PromptForm
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
        folders={mockFolders}
        initialData={initialData}
      />
    );

    const titleInput = screen.getByPlaceholderText('Örn: Gen AI Promptu') as HTMLInputElement;
    const contentTextarea = screen.getByPlaceholderText('Promptunuzu buraya yazın...') as HTMLTextAreaElement;

    expect(titleInput.value).toBe('Existing Prompt');
    expect(contentTextarea.value).toBe('Some saved content');
    expect(screen.getByText('Promptu Düzenle')).toBeTruthy();
    expect(screen.getByText('Değişiklikleri Kaydet')).toBeTruthy();
  });

  it('calls onClose when cancel or close button is clicked', () => {
    const handleClose = vi.fn();
    render(
      <PromptForm
        isOpen={true}
        onClose={handleClose}
        onSave={vi.fn()}
        folders={mockFolders}
      />
    );

    const cancelButton = screen.getByText('İptal');
    fireEvent.click(cancelButton);
    expect(handleClose).toHaveBeenCalled();
  });
});
