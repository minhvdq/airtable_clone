import AuthWrapper from '~/app/table/_components/AuthWrapper';
import TableLayoutClient from '~/app/table/_components/TableLayoutClient';

interface TableLayoutProps {
  children: React.ReactNode;
}

export default function TableLayout({ children }: TableLayoutProps) {
  return (
    <AuthWrapper>
      <TableLayoutClient>
        {children}
      </TableLayoutClient>
    </AuthWrapper>
  );
}