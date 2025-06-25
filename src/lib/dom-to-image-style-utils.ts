// src/lib/dom-to-image-style-utils.ts

// Function to apply specific print-like styles to a cloned element for canvas capture
export function applyPrintStylesToClonedElement(clonedElement: HTMLElement, originalElement: HTMLElement): void {
  const printClasses = Array.from(originalElement.classList).filter(cls => cls.startsWith('print:'));

  // Remove Tailwind's responsive text size classes from the clone
  const screenTextSizeClasses = ['text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl', 'text-5xl', 'text-6xl'];
  screenTextSizeClasses.forEach(cls => clonedElement.classList.remove(cls));
  
  // Default styles for capture
  clonedElement.style.color = 'black';
  // Set a default background for the element if one isn't more specifically set by a print class
  // For text elements, transparent is usually fine if their parent (the label) has a white background.
  if (!clonedElement.style.backgroundColor) { 
    clonedElement.style.backgroundColor = 'transparent';
  }

  printClasses.forEach(pClass => {
    if (pClass.startsWith('print:text-[')) {
      const sizeMatch = pClass.match(/print:text-\[(.*?)]/);
      if (sizeMatch?.[1]) clonedElement.style.fontSize = sizeMatch[1];
    } else if (pClass === 'print:font-bold') {
      clonedElement.style.fontWeight = 'bold';
    } else if (pClass === 'print:font-semibold') {
      clonedElement.style.fontWeight = '600';
    } else if (pClass.startsWith('print:mb-')) {
      const mbMatch = pClass.match(/print:mb-(\d+(\.\d+)?)/);
      if (mbMatch?.[1]) clonedElement.style.marginBottom = `${parseFloat(mbMatch[1]) * 4}px`;
    } else if (pClass.startsWith('print:mt-')) {
      const mtMatch = pClass.match(/print:mt-(\d+(\.\d+)?)/);
      if (mtMatch?.[1]) clonedElement.style.marginTop = `${parseFloat(mtMatch[1]) * 4}px`;
    } else if (pClass.startsWith('print:p-')) {
      const pMatch = pClass.match(/print:p-(\d+(\.\d+)?)/);
      if (pMatch?.[1]) clonedElement.style.padding = `${parseFloat(pMatch[1]) * 4}px`;
    } else if (pClass.startsWith('print:pt-')) {
      const ptMatch = pClass.match(/print:pt-(\d+(\.\d+)?)/);
      if (ptMatch?.[1]) clonedElement.style.paddingTop = `${parseFloat(ptMatch[1]) * 4}px`;
    } else if (pClass.startsWith('print:pb-')) {
      const pbMatch = pClass.match(/print:pb-(\d+(\.\d+)?)/);
      if (pbMatch?.[1]) clonedElement.style.paddingBottom = `${parseFloat(pbMatch[1]) * 4}px`;
    } else if (pClass.startsWith('print:leading-')) {
       const leadingMatch = pClass.match(/print:leading-(normal|relaxed|tight|snug|loose)/);
       if (leadingMatch?.[1]) {
         const mapping = { normal: 'normal', relaxed: '1.625', tight: '1.25', snug: '1.375', loose: '2' };
         clonedElement.style.lineHeight = mapping[leadingMatch[1] as keyof typeof mapping] || 'normal';
       }
    }
    // Width/height specific to elements *within* the label (e.g., print:w-24 for a barcode container)
    // This part of the original 'applyCaptureStyles' was complex and specific.
    // For this utility, we'll focus on text styles primarily.
    // If specific `print:w-[]` or `print:h-[]` are needed for child elements,
    // they might need more targeted handling or ensuring they are directly applied.
  });
}

// Recursively apply styles
export function applyRecursivePrintStyles(originalNode: HTMLElement, clonedNode: HTMLElement): void {
  applyPrintStylesToClonedElement(clonedNode, originalNode);
  const originalChildren = Array.from(originalNode.children) as HTMLElement[];
  const clonedChildren = Array.from(clonedNode.children) as HTMLElement[];
  originalChildren.forEach((origChild, index) => {
    if (clonedChildren[index]) {
      applyRecursivePrintStyles(origChild, clonedChildren[index]);
    }
  });
}
