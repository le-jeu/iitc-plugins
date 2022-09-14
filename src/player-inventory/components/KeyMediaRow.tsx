export default function (props) {
  const { item, children } = props;
  const details = Array.from(item.count)
    .map(([name, count]) => `${name}: ${count}`)
    .join(', ');
  return (
    <tr>
      <td>
        <a title={details}>{item.total}</a>
      </td>
      <td>{children}</td>
    </tr>
  );
}
