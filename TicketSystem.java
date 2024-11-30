import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.Scanner;

public class TicketSystem {
    public static class Ticket {
        private String id;
        private String email;
        private String description;
        private int severity;

        public Ticket(String id, String email, String description, int severity) {
            this.id = id;
            this.email = email;
            this.description = description;
            this.severity = severity;
        }

        @Override
        public String toString() {
            return "Ticket processed: [id: " + id + ", email: " + email + ", description: " + description + ", severity: " + severity + "]";
        }
    }

    public static class TaskProducer {
        private BlockingQueue<Ticket> queue;

        public TaskProducer(BlockingQueue<Ticket> queue) {
            this.queue = queue;
        }

        public void addTicket(Ticket ticket) throws InterruptedException {
            queue.put(ticket);
        }
    }

    public static class TaskConsumer implements Runnable {
        private BlockingQueue<Ticket> queue;

        public TaskConsumer(BlockingQueue<Ticket> queue) {
            this.queue = queue;
        }

        @Override
        public void run() {
            try {
                while (true) {
                    Ticket ticket = queue.take();
                    System.out.println(ticket);
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }
    }

    public static void main(String[] args) throws InterruptedException {
        BlockingQueue<Ticket> queue = new LinkedBlockingQueue<>();
        TaskProducer producer = new TaskProducer(queue);
        TaskConsumer consumer = new TaskConsumer(queue);

        new Thread(consumer).start();

        Scanner scanner = new Scanner(System.in);
        int n = scanner.nextInt();
        scanner.nextLine(); 
        for (int i = 0; i < n; i++) {
            String id = scanner.nextLine();
            String email = scanner.nextLine();
            String description = scanner.nextLine();
            int severity = scanner.nextInt();
            scanner.nextLine(); 
            producer.addTicket(new Ticket(id, email, description, severity));
        }
        scanner.close();
    }
}