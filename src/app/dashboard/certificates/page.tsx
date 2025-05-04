
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Pencil, Trash2, Link as LinkIcon, Download, Upload, Calendar, Info } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import useLocalStorage from '@/hooks/useLocalStorage';
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link';
import Image from 'next/image'; // For potential image previews
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton
import type { Certificate } from '@/types'; // Import the specific type

export default function CertificatesPage() {
  const [userName, setUserName] = useState<string | null>(null);
  const storageKey = userName ? `${userName}-certificates` : 'certificates-fallback'; // Fallback key
  const [certificates, setCertificates] = useLocalStorage<Certificate[]>(storageKey, []);
  const [editingCertificate, setEditingCertificate] = useState<Certificate | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isClient, setIsClient] = useState(false); // State to track client mount
  const { toast } = useToast();

  // Form state
  const [title, setTitle] = useState('');
  const [issuingOrganization, setIssuingOrganization] = useState('');
  const [issueDate, setIssueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [expirationDate, setExpirationDate] = useState<string>('');
  const [credentialId, setCredentialId] = useState('');
  const [credentialUrl, setCredentialUrl] = useState('');
  const [skillsInput, setSkillsInput] = useState('');
  // const [fileDataUrl, setFileDataUrl] = useState<string | undefined>(undefined);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    setIsClient(true); // Component has mounted
    const storedName = localStorage.getItem('loggedInUserName');
    setUserName(storedName);
  }, []);

  useEffect(() => {
    if (editingCertificate) {
      setTitle(editingCertificate.title);
      setIssuingOrganization(editingCertificate.issuingOrganization);
      setIssueDate(editingCertificate.issueDate.split('T')[0]);
      setExpirationDate(editingCertificate.expirationDate ? editingCertificate.expirationDate.split('T')[0] : '');
      setCredentialId(editingCertificate.credentialId || '');
      setCredentialUrl(editingCertificate.credentialUrl || '');
      setSkillsInput((editingCertificate.skills || []).join(', '));
      // setFileDataUrl(editingCertificate.fileDataUrl);
      setNotes(editingCertificate.notes || '');
      setIsFormOpen(true);
    } else {
      // Only reset if not currently editing (avoids flicker when switching edits)
      if (!isFormOpen) resetForm();
    }
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingCertificate, isFormOpen]); // Rerun when form opens/closes too

   const resetForm = () => {
     setTitle('');
     setIssuingOrganization('');
     setIssueDate(new Date().toISOString().split('T')[0]);
     setExpirationDate('');
     setCredentialId('');
     setCredentialUrl('');
     setSkillsInput('');
    //  setFileDataUrl(undefined);
     setNotes('');
     setEditingCertificate(null); // Clear editing state explicitly
   };

//    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//      ... (file handling logic) ...
//    };

   const handleFormSubmit = (e: React.FormEvent) => {
     e.preventDefault();
     if (!title.trim() || !issuingOrganization.trim()) {
        toast({ title: "Error", description: "Title and Issuing Organization are required.", variant: "destructive" });
        return;
     };

     let validCredentialUrl = credentialUrl.trim();
      if (validCredentialUrl && !validCredentialUrl.startsWith('http://') && !validCredentialUrl.startsWith('https://')) {
        validCredentialUrl = 'https://' + validCredentialUrl;
      }


     const skills = skillsInput.split(',').map(skill => skill.trim()).filter(skill => skill !== '');

     const certificateData: Omit<Certificate, 'id'> = {
        title: title.trim(),
        issuingOrganization: issuingOrganization.trim(),
        issueDate: new Date(issueDate).toISOString(),
        expirationDate: expirationDate ? new Date(expirationDate).toISOString() : undefined,
        credentialId: credentialId.trim() || undefined,
        credentialUrl: validCredentialUrl || undefined,
        skills,
        // fileDataUrl: fileDataUrl,
        notes: notes.trim() || undefined,
     };

     if (editingCertificate) {
       const updatedCertificate: Certificate = { ...certificateData, id: editingCertificate.id };
       setCertificates(prev => prev.map(c => c.id === updatedCertificate.id ? updatedCertificate : c));
       toast({ title: "Certificate Updated", description: `"${updatedCertificate.title}" updated.` });
     } else {
       const newCertificate: Certificate = { ...certificateData, id: crypto.randomUUID() };
       setCertificates(prev => [...prev, newCertificate]);
       toast({ title: "Certificate Added", description: `"${newCertificate.title}" added.` });
     }

     resetForm();
     setIsFormOpen(false);
   };

   const handleDeleteCertificate = (id: string) => {
     const certToDelete = certificates.find(c => c.id === id);
     setCertificates(prev => prev.filter(c => c.id !== id));
      if (certToDelete) {
         toast({ title: "Certificate Deleted", description: `"${certToDelete.title}" deleted.`, variant: "destructive" });
      }
   };

   const handleEditClick = (certificate: Certificate) => {
       setEditingCertificate(certificate);
       // Form will open due to useEffect dependency on editingCertificate
   };

   const handleCancelEdit = () => {
        resetForm();
        setIsFormOpen(false);
   };

   // Sort certificates (e.g., by issue date descending)
   const sortedCertificates = [...certificates].sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());

  // Render skeleton or null during SSR and initial client render before mount
  if (!isClient) {
    return (
        <div className="space-y-8">
            <header className="flex justify-between items-center">
                 <div>
                     <Skeleton className="h-9 w-48 mb-2" />
                     <Skeleton className="h-6 w-64" />
                 </div>
                <Skeleton className="h-10 w-36 rounded-md" />
            </header>
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                 {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-64 rounded-lg" />)}
             </div>
        </div>
    );
  }


  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2">Certificates</h1>
          <p className="text-lg text-muted-foreground">Manage your certifications and credentials.</p>
        </div>
        {userName && ( // Only show button if user is identified
          <Button onClick={() => { setEditingCertificate(null); resetForm(); setIsFormOpen(true); }}>
             <Plus className="mr-2 h-4 w-4" /> Add Certificate
          </Button>
        )}
      </header>

       {isFormOpen && (
         <Card className="border border-border/50 shadow-sm">
           <CardHeader>
             <CardTitle className="text-xl text-primary">{editingCertificate ? 'Edit Certificate' : 'Add New Certificate'}</CardTitle>
           </CardHeader>
           <form onSubmit={handleFormSubmit}>
             <CardContent className="space-y-4">
                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                         <Label htmlFor="cert-title">Certificate Title</Label>
                         <Input id="cert-title" value={title} onChange={e => setTitle(e.target.value)} required className="h-10 mt-1"/>
                     </div>
                     <div>
                         <Label htmlFor="cert-org">Issuing Organization</Label>
                         <Input id="cert-org" value={issuingOrganization} onChange={e => setIssuingOrganization(e.target.value)} required className="h-10 mt-1"/>
                     </div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                         <Label htmlFor="cert-issueDate">Issue Date</Label>
                         <Input id="cert-issueDate" type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} required className="h-10 mt-1"/>
                     </div>
                      <div>
                         <Label htmlFor="cert-expDate">Expiration Date (Optional)</Label>
                         <Input id="cert-expDate" type="date" value={expirationDate} onChange={e => setExpirationDate(e.target.value)} className="h-10 mt-1"/>
                     </div>
                 </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                         <Label htmlFor="cert-id">Credential ID (Optional)</Label>
                         <Input id="cert-id" value={credentialId} onChange={e => setCredentialId(e.target.value)} className="h-10 mt-1"/>
                     </div>
                     <div>
                         <Label htmlFor="cert-url">Credential URL (Optional)</Label>
                         <Input id="cert-url" type="url" value={credentialUrl} onChange={e => setCredentialUrl(e.target.value)} placeholder="https://verify..." className="h-10 mt-1"/>
                     </div>
                 </div>
                  <div>
                     <Label htmlFor="cert-skills">Skills Gained (comma-separated, optional)</Label>
                     <Input id="cert-skills" value={skillsInput} onChange={e => setSkillsInput(e.target.value)} placeholder="e.g., Project Management, Python, Cloud Computing" className="h-10 mt-1"/>
                 </div>
                  {/* File Input (commented out) */}
                 <div>
                     <Label htmlFor="cert-notes">Notes (Optional)</Label>
                     <Textarea id="cert-notes" value={notes} onChange={e => setNotes(e.target.value)} className="mt-1 min-h-[60px]"/>
                 </div>
             </CardContent>
             <CardFooter className="flex justify-end space-x-2 bg-secondary/20 p-4 border-t">
               <Button type="button" variant="outline" onClick={handleCancelEdit}>Cancel</Button>
               <Button type="submit">{editingCertificate ? 'Save Changes' : 'Add Certificate'}</Button>
             </CardFooter>
           </form>
         </Card>
       )}

       {userName ? ( // Only render list if user is identified
         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sortedCertificates.length > 0 ? sortedCertificates.map(cert => (
                 <Card key={cert.id} className="flex flex-col border border-border/50 shadow-sm transition-shadow duration-200 hover:shadow-lg hover:border-primary/30">
                     <CardHeader className="pb-3"> {/* Reduced padding */}
                         <CardTitle className="text-lg">{cert.title}</CardTitle>
                         <CardDescription>{cert.issuingOrganization}</CardDescription>
                         <div className="text-xs text-muted-foreground pt-2 space-y-1"> {/* Increased top padding */}
                             <p className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Issued: {new Date(cert.issueDate).toLocaleDateString()}</p>
                             {cert.expirationDate && <p className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Expires: {new Date(cert.expirationDate).toLocaleDateString()}</p>}
                             {cert.credentialId && <p className="flex items-center gap-1.5 text-xs">ID: {cert.credentialId}</p>}
                         </div>
                     </CardHeader>
                     <CardContent className="flex-grow space-y-3 pt-0 pb-4 pl-6 pr-4"> {/* Adjusted padding */}
                         {cert.notes && <p className="text-sm text-muted-foreground line-clamp-3">{cert.notes}</p>}
                         {cert.skills && cert.skills.length > 0 && (
                             <div className="flex flex-wrap gap-1.5"> {/* Increased gap */}
                                 {cert.skills.map(skill => <Badge key={skill} variant="secondary" className="font-normal">{skill}</Badge>)}
                             </div>
                         )}
                         {cert.credentialUrl && (
                             <Link href={cert.credentialUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1.5"> {/* Increased gap */}
                                 <LinkIcon className="h-3.5 w-3.5" /> Verify Credential
                             </Link>
                         )}
                          {/* File download/preview (commented out) */}
                     </CardContent>
                     <CardFooter className="flex justify-end gap-2 p-3 pt-0 border-t bg-secondary/20">
                         <Button variant="ghost" size="icon" onClick={() => handleEditClick(cert)} aria-label={`Edit certificate "${cert.title}"`}>
                             <Pencil className="h-4 w-4" />
                         </Button>
                         <AlertDialog>
                           <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/90 hover:bg-destructive/10" aria-label={`Delete certificate "${cert.title}"`}>
                                 <Trash2 className="h-4 w-4" />
                              </Button>
                           </AlertDialogTrigger>
                           <AlertDialogContent>
                              <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Certificate?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                      This will permanently delete the certificate "{cert.title}" from {cert.issuingOrganization}. This action cannot be undone.
                                  </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteCertificate(cert.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                              </AlertDialogFooter>
                           </AlertDialogContent>
                         </AlertDialog>
                     </CardFooter>
                 </Card>
             )) : (
                 <div className="col-span-full text-center py-10 px-4 border border-dashed rounded-lg">
                     <Info className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                     <p className="text-muted-foreground italic">No certificates added yet. Click "Add Certificate" to get started.</p>
                 </div>
             )}
         </div>
       ) : (
          // Optional: Message if user isn't loaded yet
           <div className="text-center text-muted-foreground italic py-10">
               Loading certificates...
           </div>
       )}
    </div>
  );
}
