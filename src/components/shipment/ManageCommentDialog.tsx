import { useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useWarehouse } from '@/contexts/WarehouseContext';
import type { Shipment } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

const commentSchema = z.object({
  comments: z.string().max(200, "Comments are too long").optional(),
});

type CommentFormData = z.infer<typeof commentSchema>;

interface ManageCommentDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  shipmentToManage: Shipment;
}

export default function ManageCommentDialog({ isOpen, setIsOpen, shipmentToManage }: ManageCommentDialogProps) {
  const { updateShipment } = useWarehouse();
  const { toast } = useToast();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
  });

  useEffect(() => {
    if (shipmentToManage && isOpen) {
      reset({
        comments: shipmentToManage.comments || '',
      });
    }
  }, [shipmentToManage, isOpen, reset]);


  const onSubmit: SubmitHandler<CommentFormData> = (data) => {
    updateShipment(shipmentToManage.id, { comments: data.comments });
    toast({
      title: "Comment Updated!",
      description: `Comment for shipment STS Job "${shipmentToManage.stsJob}" has been saved.`,
    });
    setIsOpen(false);
  };

  const handleClose = () => {
    setIsOpen(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); else setIsOpen(true); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center"><MessageSquare className="mr-2 h-5 w-5" /> Manage Comment</DialogTitle>
          <DialogDescription>
            Edit or add a comment for shipment STS Job: {shipmentToManage.stsJob}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div>
            <Textarea
              id="comments"
              {...register('comments')}
              placeholder="Enter your comment here..."
              rows={5}
              autoFocus
            />
            {errors.comments && <p className="text-sm text-destructive mt-1">{errors.comments.message}</p>}
          </div>
          
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Comment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
