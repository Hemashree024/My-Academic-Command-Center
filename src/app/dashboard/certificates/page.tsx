"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Pencil, Trash2, Link as LinkIcon, Download, Upload, Calendar } from 'lucide-react';
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

interface Certificate {
  id: string;
  title: string;
  issuingOrganization: string;
  issueDate: string; // ISO String
  expirationDate?: string; // ISO String
  credentialId?: string;
  credentialUrl?: string;
  skills?: string[]; // Skills gained
  // fileDataUrl?: string; // Store certificate file/image as Data URL (consider size limits)
  notes?: string;
}

export default function CertificatesPage() {
  const [userName, setUserName] = useState<string | null>(null);
  const storageKey = userName ? `${userName}-certificates` : 'certificates';
  const [certificates, setCertificates] = useLocalStorage<Certificate[]>(storageKey, []);
  const [editingCertificate, setEditingCertificate] = useState<Certificate | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
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
    setMounted(true);
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
      resetForm();
    }
  }, [editingCertificate]);

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
     setEditingCertificate(null);
   };

//    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//      const file = event.target.files?.[0];
//      if (file) {
//        const reader = new FileReader();
//        reader.onloadend = () => {
//          setFileDataUrl(reader.result as string);
//          toast({ title: "File Ready", description: `${file.name} selected.` });
//        };
//        reader.onerror = () => {
//             toast({ title: "File Error", description: `Error reading ${file.name}.`, variant: "destructive" });
//        }
//        // Consider adding size validation here
//        reader.readAsDataURL(file);
//      }
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
   };

   const handleCancelEdit = () => {
        resetForm();
        setIsFormOpen(false);
   };

   // Sort certificates (e.g., by issue date descending)
   const sortedCertificates = [...certificates].sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());


  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2">Certificates</h1>
          <p className="text-lg text-muted-foreground">Manage your certifications and credentials.</p>
        </div>
        <Button onClick={() => { setEditingCertificate(null); setIsFormOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Add Certificate
        </Button>
      </header>

       {isFormOpen && (
         <Card>
           <CardHeader>
             <CardTitle>{editingCertificate ? 'Edit Certificate' : 'Add New Certificate'}</CardTitle>
           </CardHeader>
           <form onSubmit={handleFormSubmit}>
             <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                         <Label htmlFor="cert-title">Certificate Title</Label>
                         <Input id="cert-title" value={title} onChange={e => setTitle(e.target.value)} required />
                     </div>
                     <div>
                         <Label htmlFor="cert-org">Issuing Organization</Label>
                         <Input id="cert-org" value={issuingOrganization} onChange={e => setIssuingOrganization(e.target.value)} required />
                     </div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                         <Label htmlFor="cert-issueDate">Issue Date</Label>
                         <Input id="cert-issueDate" type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} required />
                     </div>
                      <div>
                         <Label htmlFor="cert-expDate">Expiration Date (Optional)</Label>
                         <Input id="cert-expDate" type="date" value={expirationDate} onChange={e => setExpirationDate(e.target.value)} />
                     </div>
                 </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                         <Label htmlFor="cert-id">Credential ID (Optional)</Label>
                         <Input id="cert-id" value={credentialId} onChange={e => setCredentialId(e.target.value)} />
                     </div>
                     <div>
                         <Label htmlFor="cert-url">Credential URL (Optional)</Label>
                         <Input id="cert-url" type="url" value={credentialUrl} onChange={e => setCredentialUrl(e.target.value)} placeholder="https://verify..." />
                     </div>
                 </div>
                  <div>
                     <Label htmlFor="cert-skills">Skills Gained (comma-separated, optional)</Label>
                     <Input id="cert-skills" value={skillsInput} onChange={e => setSkillsInput(e.target.value)} placeholder="e.g., Project Management, Python, Cloud Computing" />
                 </div>
                  {/* <div>
                    <Label htmlFor="cert-file">Certificate File (Optional)</Label>
                    <Input id="cert-file" type="file" onChange={handleFileChange} accept="image/*,.pdf" />
                     {fileDataUrl && (
                         <div className="mt-2 text-sm text-muted-foreground">
                           {fileDataUrl.startsWith('data:image') ? (
                                <Image src={fileDataUrl} alt="Certificate preview" width={100} height={70} className="rounded border" />
                           ) : (
                                <span>File selected: {(document.getElementById('cert-file') as HTMLInputElement)?.files?.[0]?.name}</span>
                           )}
                         </div>
                     )}
                 </div> */}
                 <div>
                     <Label htmlFor="cert-notes">Notes (Optional)</Label>
                     <Textarea id="cert-notes" value={notes} onChange={e => setNotes(e.target.value)} />
                 </div>
             </CardContent>
             <CardFooter className="flex justify-end space-x-2">
               <Button type="button" variant="outline" onClick={handleCancelEdit}>Cancel</Button>
               <Button type="submit">{editingCertificate ? 'Save Changes' : 'Add Certificate'}</Button>
             </CardFooter>
           </form>
         </Card>
       )}

       {mounted && userName && (
         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sortedCertificates.length > 0 ? sortedCertificates.map(cert => (
                 <Card key={cert.id} className="flex flex-col">
                     <CardHeader>
                         <CardTitle>{cert.title}</CardTitle>
                         <CardDescription>{cert.issuingOrganization}</CardDescription>
                         <div className="text-xs text-muted-foreground pt-1 space-y-0.5">
                             <p className="flex items-center gap-1.5"><Calendar className="h-3 w-3" /> Issued: {new Date(cert.issueDate).toLocaleDateString()}</p>
                             {cert.expirationDate && <p className="flex items-center gap-1.5"><Calendar className="h-3 w-3" /> Expires: {new Date(cert.expirationDate).toLocaleDateString()}</p>}
                             {cert.credentialId && <p>ID: {cert.credentialId}</p>}
                         </div>
                     </CardHeader>
                     <CardContent className="flex-grow space-y-2">
                         {cert.notes && <p className="text-sm text-muted-foreground line-clamp-3">{cert.notes}</p>}
                         {cert.skills && cert.skills.length > 0 && (
                             <div className="flex flex-wrap gap-1">
                                 {cert.skills.map(skill => <Badge key={skill} variant="secondary">{skill}</Badge>)}
                             </div>
                         )}
                         {cert.credentialUrl && (
                             <Link href={cert.credentialUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                                 <LinkIcon className="h-3 w-3" /> Verify Credential
                             </Link>
                         )}
                          {/* {cert.fileDataUrl && (
                            // Option 1: Show a preview if image
                            cert.fileDataUrl.startsWith('data:image') ?
                               <Image src={cert.fileDataUrl} alt={`${cert.title} preview`} width={60} height={40} className="mt-2 rounded border" />
                            // Option 2: Show a download link/button
                            : <Button variant="outline" size="sm" asChild><a href={cert.fileDataUrl} download={`${cert.title}-certificate.${cert.fileDataUrl.substring(cert.fileDataUrl.indexOf('/') + 1, cert.fileDataUrl.indexOf(';'))}`}><Download className="mr-1 h-3 w-3" /> Download</a></Button>
                          )} */}
                     </CardContent>
                     <CardFooter className="flex justify-end gap-2">
                         <Button variant="ghost" size="icon" onClick={() => handleEditClick(cert)}>
                             <Pencil className="h-4 w-4" />
                         </Button>
                         <AlertDialog>
                           <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/90 hover:bg-destructive/10">
                                 <Trash2 className="h-4 w-4" />
                              </Button>
                           </AlertDialogTrigger>
                           <AlertDialogContent>
                              <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Certificate?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                      This will permanently delete the certificate "{cert.title}" from {cert.issuingOrganization}.
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
                 <p className="text-muted-foreground italic md:col-span-2 lg:col-span-3 text-center">No certificates added yet.</p>
             )}
         </div>
       )}
    </div>
  );
}
