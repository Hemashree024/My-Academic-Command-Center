
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Pencil, Trash2, Info, CalendarDays, MapPin, Link as LinkIcon } from 'lucide-react';
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
import useLocalStorage from '@/hooks/useLocalStorage';
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from '@/components/ui/skeleton';
import type { EventItem } from '@/types';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';
import Link from 'next/link';

export default function EventsPage() {
  const [userName, setUserName] = useState<string | null>(null);
  const storageKey = userName ? `${userName}-events` : 'events-fallback';
  const [events, setEvents] = useLocalStorage<EventItem[]>(storageKey, []);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [location, setLocation] = useState('');
  const [link, setLink] = useState('');
  const [isStartPopoverOpen, setIsStartPopoverOpen] = useState(false);
  const [isEndPopoverOpen, setIsEndPopoverOpen] = useState(false);


  useEffect(() => {
    setIsClient(true);
    const storedName = localStorage.getItem('loggedInUserName');
    setUserName(storedName);
  }, []);

  useEffect(() => {
    if (editingEvent) {
      setTitle(editingEvent.title);
      setDescription(editingEvent.description || '');
      try {
        const parsedStartDate = editingEvent.startDate ? new Date(editingEvent.startDate) : new Date();
        setStartDate(!isNaN(parsedStartDate.getTime()) ? parsedStartDate : new Date());
        const parsedEndDate = editingEvent.endDate ? new Date(editingEvent.endDate) : undefined;
        setEndDate(parsedEndDate && !isNaN(parsedEndDate.getTime()) ? parsedEndDate : undefined);
      } catch {
        setStartDate(new Date());
        setEndDate(undefined);
      }
      setLocation(editingEvent.location || '');
      setLink(editingEvent.link || '');
      setIsFormOpen(true);
    } else {
      if (!isFormOpen) resetForm();
    }
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingEvent, isFormOpen]);

   const resetForm = () => {
     setTitle('');
     setDescription('');
     setStartDate(new Date());
     setEndDate(undefined);
     setLocation('');
     setLink('');
     setEditingEvent(null);
     setIsStartPopoverOpen(false);
     setIsEndPopoverOpen(false);
   };

   const handleFormSubmit = (e: React.FormEvent) => {
     e.preventDefault();
     if (!title.trim() || !startDate) {
        toast({ title: "Error", description: "Event Title and Start Date are required.", variant: "destructive" });
        return;
     };
     if (endDate && startDate && endDate < startDate) {
         toast({ title: "Error", description: "End Date cannot be before Start Date.", variant: "destructive" });
         return;
     }

     let validLink = link.trim();
     if (validLink && !validLink.startsWith('http://') && !validLink.startsWith('https://')) {
        validLink = 'https://' + validLink;
     }

     const eventData: Omit<EventItem, 'id'> = {
        title: title.trim(),
        description: description.trim() || undefined,
        startDate: startDate.toISOString(),
        endDate: endDate?.toISOString(),
        location: location.trim() || undefined,
        link: validLink || undefined,
     };

     if (editingEvent) {
       const updatedEvent: EventItem = { ...eventData, id: editingEvent.id };
       setEvents(prev => prev.map(ev => ev.id === updatedEvent.id ? updatedEvent : ev));
       toast({ title: "Event Updated", description: `"${updatedEvent.title}" updated.` });
     } else {
       const newEvent: EventItem = { ...eventData, id: crypto.randomUUID() };
       setEvents(prev => [...prev, newEvent]);
       toast({ title: "Event Added", description: `"${newEvent.title}" added.` });
     }

     resetForm();
     setIsFormOpen(false);
   };

   const handleDeleteEvent = (id: string) => {
     const eventToDelete = events.find(ev => ev.id === id);
     setEvents(prev => prev.filter(ev => ev.id !== id));
      if (eventToDelete) {
         toast({ title: "Event Deleted", description: `"${eventToDelete.title}" deleted.`, variant: "destructive" });
      }
   };

   const handleEditClick = (event: EventItem) => {
       setEditingEvent(event);
   };

   const handleCancelEdit = () => {
        resetForm();
        setIsFormOpen(false);
   };

    const handleStartDateSelect = (date: Date | undefined) => {
      setStartDate(date);
      setIsStartPopoverOpen(false);
      // If end date is before new start date, clear end date
      if (endDate && date && endDate < date) {
          setEndDate(undefined);
      }
   }
   const handleEndDateSelect = (date: Date | undefined) => {
      setEndDate(date);
      setIsEndPopoverOpen(false);
   }

   // Sort events: Upcoming first, then past. Within each group, sort by start date ascending.
   const sortedEvents = useMemo(() => {
       const now = new Date(); // Use start of today for comparison consistency
       now.setHours(0, 0, 0, 0);
       const nowTime = now.getTime();

       return [...events].sort((a, b) => {
           const dateAStart = new Date(a.startDate);
           dateAStart.setHours(0, 0, 0, 0);
           const dateA = dateAStart.getTime();

           const dateBStart = new Date(b.startDate);
           dateBStart.setHours(0, 0, 0, 0);
           const dateB = dateBStart.getTime();

           const isAPast = dateA < nowTime;
           const isBPast = dateB < nowTime;

           if (isAPast !== isBPast) {
               return isAPast ? 1 : -1; // Past events go last
           }
           return dateA - dateB; // Sort by date ascending otherwise
       });
   }, [events]);

   // Separate into upcoming and past after sorting
    const upcomingEvents = sortedEvents.filter(event => {
        const dateStart = new Date(event.startDate);
        dateStart.setHours(0, 0, 0, 0);
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        return dateStart.getTime() >= todayStart.getTime();
    });
    const pastEvents = sortedEvents.filter(event => {
        const dateStart = new Date(event.startDate);
        dateStart.setHours(0, 0, 0, 0);
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        return dateStart.getTime() < todayStart.getTime();
    });


   // Render skeleton
   if (!isClient) {
     return (
       <div className="space-y-8">
         <header className="flex justify-between items-center">
           <div>
             <Skeleton className="h-9 w-32 mb-2" />
             <Skeleton className="h-6 w-64" />
           </div>
           <Skeleton className="h-10 w-36 rounded-md" />
         </header>
         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
           {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-52 rounded-lg" />)}
         </div>
       </div>
     );
   }


  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2 flex items-center gap-2"><CalendarDays className="h-7 w-7"/> Events</h1>
          <p className="text-lg text-muted-foreground">Keep track of upcoming events and activities.</p>
        </div>
        {userName && (
           <Button onClick={() => { setEditingEvent(null); resetForm(); setIsFormOpen(true); }}>
             <Plus className="mr-2 h-4 w-4" /> Add Event
           </Button>
        )}
      </header>

       {isFormOpen && (
         <Card className="border border-border/50 shadow-sm">
           <CardHeader>
             <CardTitle className="text-xl text-primary">{editingEvent ? 'Edit Event' : 'Add New Event'}</CardTitle>
           </CardHeader>
           <form onSubmit={handleFormSubmit}>
             <CardContent className="space-y-4">
               <div>
                 <Label htmlFor="evt-title">Event Title</Label>
                 <Input id="evt-title" value={title} onChange={e => setTitle(e.target.value)} required className="h-10 mt-1"/>
               </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                         <Label htmlFor="evt-startDate">Start Date</Label>
                         <Popover open={isStartPopoverOpen} onOpenChange={setIsStartPopoverOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full justify-start text-left font-normal h-10 mt-1",
                                    !startDate && "text-muted-foreground"
                                )}
                                >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {startDate ? format(startDate, "PPP") : <span>Pick start date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                mode="single"
                                selected={startDate}
                                onSelect={handleStartDateSelect}
                                initialFocus
                                />
                            </PopoverContent>
                         </Popover>
                     </div>
                     <div>
                         <Label htmlFor="evt-endDate">End Date (Optional)</Label>
                         <Popover open={isEndPopoverOpen} onOpenChange={setIsEndPopoverOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full justify-start text-left font-normal h-10 mt-1",
                                    !endDate && "text-muted-foreground"
                                )}
                                >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {endDate ? format(endDate, "PPP") : <span>Pick end date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                mode="single"
                                selected={endDate}
                                onSelect={handleEndDateSelect}
                                disabled={(date) => startDate ? date < startDate : false} // Disable dates before start date
                                initialFocus
                                />
                            </PopoverContent>
                         </Popover>
                     </div>
                </div>
               <div>
                 <Label htmlFor="evt-location">Location (Optional)</Label>
                 <Input id="evt-location" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g., Online, Room 301" className="h-10 mt-1"/>
               </div>
               <div>
                 <Label htmlFor="evt-link">Event Link (Optional)</Label>
                 <Input id="evt-link" type="url" value={link} onChange={e => setLink(e.target.value)} placeholder="https://..." className="h-10 mt-1"/>
               </div>
               <div>
                 <Label htmlFor="evt-desc">Description (Optional)</Label>
                 <Textarea id="evt-desc" value={description} onChange={e => setDescription(e.target.value)} className="mt-1 min-h-[60px]"/>
               </div>
             </CardContent>
             <CardFooter className="flex justify-end space-x-2 bg-secondary/20 p-4 border-t">
               <Button type="button" variant="outline" onClick={handleCancelEdit}>Cancel</Button>
               <Button type="submit">{editingEvent ? 'Save Changes' : 'Add Event'}</Button>
             </CardFooter>
           </form>
         </Card>
       )}

       {userName ? (
         <>
           {/* Upcoming Events */}
           <div>
              <h2 className="text-2xl font-semibold mb-4 text-primary border-b pb-2">Upcoming Events</h2>
               {upcomingEvents.length > 0 ? (
                 <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {upcomingEvents.map(event => (
                         <Card key={event.id} className="flex flex-col border border-border/50 shadow-sm transition-shadow duration-200 hover:shadow-lg hover:border-primary/30">
                             <CardHeader className="pb-3">
                                 <CardTitle className="text-lg">{event.title}</CardTitle>
                                 <CardDescription className="text-xs text-muted-foreground pt-1">
                                    {format(new Date(event.startDate), 'PPP')}
                                    {event.endDate && ` - ${format(new Date(event.endDate), 'PPP')}`}
                                    {isToday(new Date(event.startDate)) && <span className="text-orange-600 dark:text-orange-400 font-semibold"> (Today)</span>}
                                 </CardDescription>
                             </CardHeader>
                             <CardContent className="flex-grow space-y-3 pt-0 pb-4 pl-6 pr-4">
                                 {event.location && <p className="text-sm text-muted-foreground flex items-center gap-1.5"><MapPin className="h-4 w-4"/> {event.location}</p>}
                                 {event.description && <p className="text-sm text-muted-foreground line-clamp-3">{event.description}</p>}
                                 {event.link && (
                                     <Link href={event.link} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1.5">
                                         <LinkIcon className="h-3.5 w-3.5" /> Event Details
                                     </Link>
                                 )}
                             </CardContent>
                             <CardFooter className="flex justify-end gap-2 p-3 pt-0 border-t bg-secondary/20">
                                 <Button variant="ghost" size="icon" onClick={() => handleEditClick(event)} aria-label={`Edit event "${event.title}"`}>
                                     <Pencil className="h-4 w-4" />
                                 </Button>
                                 <AlertDialog>
                                   <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/90 hover:bg-destructive/10" aria-label={`Delete event "${event.title}"`}>
                                         <Trash2 className="h-4 w-4" />
                                      </Button>
                                   </AlertDialogTrigger>
                                   <AlertDialogContent>
                                      <AlertDialogHeader>
                                          <AlertDialogTitle>Delete Event?</AlertDialogTitle>
                                          <AlertDialogDescription>
                                              This will permanently delete "{event.title}". This action cannot be undone.
                                          </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => handleDeleteEvent(event.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                      </AlertDialogFooter>
                                   </AlertDialogContent>
                                 </AlertDialog>
                             </CardFooter>
                         </Card>
                     ))}
                 </div>
               ) : (
                 <div className="col-span-full text-center py-10 px-4 border border-dashed rounded-lg">
                     <Info className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                     <p className="text-muted-foreground italic">No upcoming events added yet. Click "Add Event" to get started.</p>
                 </div>
               )}
           </div>

            {/* Past Events */}
           {pastEvents.length > 0 && (
                <div className="mt-12">
                    <h2 className="text-2xl font-semibold mb-4 text-muted-foreground border-b pb-2">Past Events</h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {pastEvents.map(event => (
                            <Card key={event.id} className="flex flex-col border border-border/30 bg-card/80 shadow-sm opacity-70 hover:opacity-100 transition-opacity duration-200">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg text-muted-foreground">{event.title}</CardTitle>
                                    <CardDescription className="text-xs text-muted-foreground pt-1">
                                        {format(new Date(event.startDate), 'PPP')}
                                        {event.endDate && ` - ${format(new Date(event.endDate), 'PPP')}`}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex-grow space-y-3 pt-0 pb-4 pl-6 pr-4">
                                    {event.location && <p className="text-sm text-muted-foreground flex items-center gap-1.5"><MapPin className="h-4 w-4"/> {event.location}</p>}
                                    {event.description && <p className="text-sm text-muted-foreground line-clamp-2 italic">{event.description}</p>}
                                     {event.link && (
                                         <Link href={event.link} target="_blank" rel="noopener noreferrer" className="text-sm text-primary/80 hover:underline flex items-center gap-1.5">
                                             <LinkIcon className="h-3.5 w-3.5" /> Event Details
                                         </Link>
                                     )}
                                </CardContent>
                                <CardFooter className="flex justify-end gap-2 p-3 pt-0 border-t bg-secondary/10">
                                     {/* Edit button removed for past events, can be re-added if needed */}
                                     {/* <Button variant="ghost" size="icon" onClick={() => handleEditClick(event)} aria-label={`Edit past event "${event.title}"`}>
                                         <Pencil className="h-4 w-4" />
                                     </Button> */}
                                     <AlertDialog>
                                       <AlertDialogTrigger asChild>
                                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/90 hover:bg-destructive/10" aria-label={`Delete past event "${event.title}"`}>
                                             <Trash2 className="h-4 w-4" />
                                          </Button>
                                       </AlertDialogTrigger>
                                       <AlertDialogContent>
                                          <AlertDialogHeader>
                                              <AlertDialogTitle>Delete Past Event?</AlertDialogTitle>
                                              <AlertDialogDescription>
                                                  This will permanently delete "{event.title}". This action cannot be undone.
                                              </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                                              <AlertDialogAction onClick={() => handleDeleteEvent(event.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                          </AlertDialogFooter>
                                       </AlertDialogContent>
                                     </AlertDialog>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </div>
           )}
        </>
       ) : (
           <div className="text-center text-muted-foreground italic py-10">
               Loading events...
           </div>
       )}
    </div>
  );
}
