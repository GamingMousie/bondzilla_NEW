
"use client";

import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { FileUp, Trash2 } from 'lucide-react';
import type { TrailerUpdateData } from '@/types';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = ['application/pdf'];

const attachDocumentSchema = z.object({
  documentFile: z
    .any()
    .optional() // Optional because user might only want to clear the existing doc
    .refine(
      (files) => !files || files?.[0]?.size <= MAX_FILE_SIZE,
      `Max file size is 5MB.`
    )
    .refine(
      (files) => !files || ACCEPTED_FILE_TYPES.includes(files?.[0]?.type),
      "Only .pdf files are accepted."
    ),
});

type AttachDocumentFormData = z.infer<typeof attachDocumentSchema>;

interface AttachTrailerDocumentDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  trailerId: string;
  trailerIdentifier: string;
  documentTypeField: keyof TrailerUpdateData; // e.g., 'outturnReportDocumentName'
  documentFriendlyName: string; // e.g., "Out-turn Report"
  currentDocumentName?: string | null;
  onDocumentAction: (
    trailerId: string,
    docField: keyof TrailerUpdateData,
    newDocumentName: string | null // string if new/changed, null if cleared
  ) => void;
}

export default function AttachTrailerDocumentDialog({
  isOpen,
  setIsOpen,
  trailerId,
  trailerIdentifier,
  documentTypeField,
  documentFriendlyName,
  currentDocumentName,
  onDocumentAction,
}: AttachTrailerDocumentDialogProps) {
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AttachDocumentFormData>({
    resolver: zodResolver(attachDocumentSchema),
  });

  const onSubmit: SubmitHandler<AttachDocumentFormData> = (data) => {
    const newFile = data.documentFile?.[0] as File | undefined;
    if (newFile) {
      onDocumentAction(trailerId, documentTypeField, newFile.name);
      toast({
        title: `${documentFriendlyName} Updated!`,
        description: `'${newFile.name}' has been associated with trailer ${trailerIdentifier}.`,
      });
    } else if (!newFile && !currentDocumentName) {
      // No new file and no current document, likely an erroneous submit, but do nothing.
      // Or, if user just clicks save without selecting new file or clearing.
       toast({
        title: "No Changes",
        description: `No new ${documentFriendlyName.toLowerCase()} was selected.`,
        variant: "default",
      });
    } else {
        // This case implies currentDocumentName exists, and no new file was selected.
        // The action here depends on whether a "clear" button was pressed or just save.
        // We assume the "Save" button implies keeping the current if no new file.
        // Clearing is handled by a separate button.
         toast({
            title: `${documentFriendlyName} Unchanged`,
            description: `The existing ${documentFriendlyName.toLowerCase()} '${currentDocumentName}' remains associated.`,
         });
    }
    reset();
    setIsOpen(false);
  };

  const handleClearDocument = () => {
    onDocumentAction(trailerId, documentTypeField, null); // Pass null to indicate clearing
    toast({
      title: `${documentFriendlyName} Cleared!`,
      description: `The ${documentFriendlyName.toLowerCase()} has been disassociated from trailer ${trailerIdentifier}.`,
      variant: 'destructive',
    });
    reset();
    setIsOpen(false);
  };

  const dialogTitle = currentDocumentName
    ? `Manage ${documentFriendlyName}`
    : `Attach ${documentFriendlyName}`;
  const dialogDescription = `Upload or clear the ${documentFriendlyName.toLowerCase()} for trailer: ${trailerIdentifier}.`;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) reset();
      }}
    >
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <FileUp className="mr-2 h-5 w-5" />
            {dialogTitle}
          </DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
          {currentDocumentName && (
            <div className="text-sm">
              Current Document: <span className="font-semibold">{currentDocumentName}</span>
            </div>
          )}
          <div>
            <Label htmlFor="documentFile" className="text-sm font-medium">
              {currentDocumentName ? `Replace ${documentFriendlyName} (PDF)` : `Upload ${documentFriendlyName} (PDF)`}
            </Label>
            <Input
              id="documentFile"
              type="file"
              {...register('documentFile')}
              accept={ACCEPTED_FILE_TYPES.join(',')}
              className="mt-1 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
            />
            {errors.documentFile && (
              <p className="mt-1 text-sm text-destructive">
                {(errors.documentFile as any)?.message}
              </p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              Max file size: 5MB. Accepted type: PDF.
            </p>
          </div>
          <DialogFooter className="pt-4 flex justify-between sm:justify-between w-full">
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => { setIsOpen(false); reset(); }}>
                Cancel
              </Button>
              {currentDocumentName && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleClearDocument}
                  className="flex items-center"
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Clear Current
                </Button>
              )}
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
